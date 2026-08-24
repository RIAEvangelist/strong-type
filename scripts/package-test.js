import {execFileSync} from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const npmCli=process.env.npm_execpath;
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'strong-type-package-'));

const execute=function(command,args,options={}){
    return execFileSync(command,args,{cwd:options.cwd || root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
};

const executeNpm=function(args,options={}){
    if(!npmCli || !fs.existsSync(npmCli)){
        throw new Error('package test: npm_execpath must identify the active npm CLI');
    }
    return execute(process.execPath,[npmCli,...args],options);
};

const assert=function(condition,message){
    if(!condition){
        throw new Error(`package test: ${message}`);
    }
};

try{
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
    assert(manifest.browser === './index.js','browser metadata must use the shared native entry');
    for(const field of ['dependencies','optionalDependencies','peerDependencies','bundledDependencies']){
        assert(!Object.prototype.hasOwnProperty.call(manifest,field),`${field} makes the zero-runtime-dependency conflict exemption invalid`);
    }

    const packed=JSON.parse(executeNpm(['pack','--json','--pack-destination',temporary]));
    assert(Array.isArray(packed) && packed.length === 1,'npm pack must produce one tarball');
    const details=packed[0];
    const expected=[
        'CHANGELOG.md',
        'MIGRATION.md',
        'README.md',
        'assets/strong-type-header.png',
        'benchmark/core.js',
        'index.js',
        'licence',
        'node.js',
        'package.json'
    ].sort();
    const files=details.files.map(current=>current.path.replace(/\\/g,'/')).sort();
    assert(JSON.stringify(files) === JSON.stringify(expected),`tarball files differ: ${files.join(', ')}`);

    const consumer=path.join(temporary,'consumer');
    fs.mkdirSync(consumer);
    fs.writeFileSync(path.join(consumer,'package.json'),JSON.stringify({name:'strong-type-packed-consumer',private:true,type:'module'},null,2));
    const tarball=path.join(temporary,details.filename);
    executeNpm(['install','--ignore-scripts','--no-audit','--no-fund',tarball],{cwd:consumer});

    const tree=JSON.parse(executeNpm(['ls','--omit=dev','--all','--json'],{cwd:consumer}));
    const installed=tree.dependencies && tree.dependencies['strong-type'];
    assert(installed && installed.version === manifest.version,'packed consumer must install the candidate version');
    assert(!installed.dependencies || Object.keys(installed.dependencies).length === 0,'packed package must have no runtime dependency tree');

    const smoke=`
        import fs from 'node:fs';
        import Is,{Is as NamedIs} from 'strong-type';
        import ExplicitIs from 'strong-type/index.js';
        import IsNode,{IsNode as NamedIsNode} from 'strong-type/node';
        import ExplicitIsNode from 'strong-type/node.js';
        const metadata=JSON.parse(fs.readFileSync('./node_modules/strong-type/package.json','utf8'));
        if(Is !== NamedIs || Is !== ExplicitIs) throw new Error('core ESM entries diverged');
        if(IsNode !== NamedIsNode || IsNode !== ExplicitIsNode) throw new Error('Node ESM entries diverged');
        if(metadata.browser !== './index.js') throw new Error('browser entry missing from tarball');
        if(!new Is(false).plainObject({candidate:true})) throw new Error('core entry did not execute');
        if(!new IsNode(false).buffer(Buffer.from('candidate'))) throw new Error('Node entry did not execute');
        console.log('packed-consumer ESM entries passed');
    `;
    const smokeOutput=execute(process.execPath,['--input-type=module','--eval',smoke],{cwd:consumer}).trim();
    assert(smokeOutput.includes('packed-consumer ESM entries passed'),'packed consumer smoke did not complete');

    console.log(`package test: ${manifest.version}`);
    console.log(`tarball integrity: ${details.integrity}`);
    console.log('runtime dependencies: 0 (conflict test not applicable)');
    console.log(smokeOutput);
}finally{
    fs.rmSync(temporary,{recursive:true,force:true});
}
