import Is from '../index.js';
import IsNode from '../node.js';
import {coreMethods,nodeRows,validatorGroups} from '../docs/reference.js';
import * as fs from 'node:fs';
import {equal,run,test} from './harness.js';

const read=function(path){
    return fs.readFileSync(new URL(path,import.meta.url),'utf8');
};

const helperNames=new Set([
    'throw',
    'check',
    'typeCheck',
    'instanceCheck',
    'symbolStringCheck',
    'compare',
    'globalInstanceCheck',
    'nestedInstanceCheck',
    'globalValueCheck',
    'nestedValueCheck',
    'union'
]);

const pageNames=['index.html','reference.html','testing.html','playground.html'];
const pages=new Map(pageNames.map(name=>[name,read(`../${name}`)]));
const coreNames=Object.getOwnPropertyNames(Is.prototype).filter(name=>name !== 'constructor' && !helperNames.has(name)).sort();
const documentedCore=validatorGroups.flatMap(group=>group.rows.map(current=>current.method)).sort();
const nodeNames=Object.getOwnPropertyNames(IsNode.prototype).filter(name=>name !== 'constructor' && name !== 'utilTypeCheck').sort();
const documentedNode=nodeRows.map(current=>current.method).sort();
const readme=read('../README.md');
const packageData=JSON.parse(read('../package.json'));

const localTargets=function(name,html){
    const targets=[];
    const pattern=/(?:href|src)="([^"]+)"/g;
    let match;
    while((match=pattern.exec(html))){
        const target=match[1];
        if(/^(?:https?:|mailto:|data:)/i.test(target)){
            continue;
        }
        targets.push(target);
    }
    return targets;
};

const localTargetExists=function(pageName,target){
    const base=new URL(`../${pageName}`,import.meta.url);
    const [pathPart,fragment]=target.split('#');
    let resolved=new URL(pathPart || base.href,base);
    if(resolved.pathname.endsWith('/')){
        resolved=new URL('index.html',resolved);
    }
    if(!fs.existsSync(resolved)){
        return false;
    }
    if(!fragment){
        return true;
    }
    const source=fs.readFileSync(resolved,'utf8');
    return source.includes(`id="${decodeURIComponent(fragment)}"`);
};

test('all 183 isomorphic validators are documented exactly once',()=>{
    equal(documentedCore.length,183);
    equal(new Set(documentedCore).size,documentedCore.length);
    equal(JSON.stringify(documentedCore),JSON.stringify(coreNames));
});

test('all 18 Node validators are documented exactly once',()=>{
    equal(documentedNode.length,18);
    equal(new Set(documentedNode).size,documentedNode.length);
    equal(JSON.stringify(documentedNode),JSON.stringify(nodeNames));
});

test('all public core and union helpers are documented',()=>{
    const names=coreMethods.map(current=>current.method.split('(')[0]).sort();
    equal(JSON.stringify(names),JSON.stringify([...helperNames].sort()));
});

test('README has the local header, coverage tables, module script, and no profile avatar',()=>{
    equal(readme.startsWith('![strong-type JavaScript values passing through a native type-validation gate](./assets/strong-type-header.png)'),true);
    equal(readme.includes('## Tests and coverage'),true);
    equal(readme.includes('<script type="module">'),true);
    equal(readme.includes('95.85%'),true);
    equal(/avatars\d*\.githubusercontent\.com/i.test(readme),false);
    equal(/RIAEvangelist\.png/i.test(readme),false);
});

test('README names every public validator and every documentation page',()=>{
    const missing=[...documentedCore,...documentedNode].filter(name=>!readme.includes(name));
    equal(missing.length,0,`missing README methods: ${missing.join(', ')}`);
    for(const pageName of pageNames.slice(1)){
        equal(readme.includes(pageName),true,`README does not link ${pageName}`);
    }
});

test('the four-page site contains every required page section',()=>{
    const required={
        'index.html':['start','guarantees','install','quick-start','browser-use','entry-points','quality','explore'],
        'reference.html':['reference','types','core','unions','node','support'],
        'testing.html':['testing','coverage','suites','ci','commands','limits'],
        'playground.html':['playground','recipes','browser-module']
    };
    for(const [name,ids] of Object.entries(required)){
        const source=pages.get(name);
        const missing=ids.filter(id=>!source.includes(`id="${id}"`));
        equal(missing.length,0,`${name} missing sections: ${missing.join(', ')}`);
    }
});

test('every local site link and asset target resolves',()=>{
    const missing=[];
    for(const [name,html] of pages){
        for(const target of localTargets(name,html)){
            if(!localTargetExists(name,target)){
                missing.push(`${name} -> ${target}`);
            }
        }
    }
    equal(missing.length,0,`missing local targets: ${missing.join(', ')}`);
});

test('the site loads no remote script, stylesheet, font, or image',()=>{
    for(const [name,html] of pages){
        equal(/<(script|link|img)[^>]+https?:\/\//i.test(html),false,`${name} loads a remote resource`);
    }
    equal(/@import\s+url\(\s*['"]?https?:\/\//i.test(read('../docs.css')),false);
});

test('the playground and package preserve native unbundled entry points',()=>{
    const frame=read('../playground/frame.html');
    const runner=read('../playground/runner.js');
    equal(frame.includes('"strong-type": "../index.js"'),true);
    equal(runner.includes("import Is from 'strong-type'"),true);
    equal(frame.includes('node.js'),false);
    equal(Object.prototype.hasOwnProperty.call(packageData,'dependencies'),false);
    equal(Object.prototype.hasOwnProperty.call(packageData,'devDependencies'),false);
    equal(packageData.exports['.'],'./index.js');
    equal(packageData.exports['./index.js'],'./index.js');
    equal(packageData.exports['./node'],'./node.js');
    equal(packageData.exports['./node.js'],'./node.js');
});

test('native tests, coverage gates, Pages files, and static assets are wired',()=>{
    const files=['../docs.css','../docs.js','../docs/reference.js','../playground/frame.html','../playground/playground.css','../playground/runner.js','../assets/strong-type-header.png','../scripts/serve.js','../scripts/test.js'];
    const missing=files.filter(path=>!fs.existsSync(new URL(path,import.meta.url)));
    equal(missing.length,0,`missing static files: ${missing.join(', ')}`);
    equal(read('../scripts/test.js').includes("'--test'"),true);
    equal(packageData.scripts.coverage.includes('--experimental-test-coverage'),true);
    equal(packageData.scripts.coverage.includes('--test-coverage-functions=95'),true);
    equal(read('../.github/workflows/ci.yml').includes('npm run coverage'),true);
    const pagesWorkflow=read('../.github/workflows/pages.yml');
    for(const pageName of pageNames){
        equal(pagesWorkflow.includes(pageName),true,`Pages workflow omits ${pageName}`);
    }
    equal(fs.existsSync(new URL('../coverage',import.meta.url)),false);
});

run().catch(err=>{
    console.error(err);
    process.exitCode=1;
});
