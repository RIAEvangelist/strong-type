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

const coreNames=Object.getOwnPropertyNames(Is.prototype).filter(name=>name !== 'constructor' && !helperNames.has(name)).sort();
const documentedCore=validatorGroups.flatMap(group=>group.rows.map(current=>current.method)).sort();
const nodeNames=Object.getOwnPropertyNames(IsNode.prototype).filter(name=>name !== 'constructor' && name !== 'utilTypeCheck').sort();
const documentedNode=nodeRows.map(current=>current.method).sort();
const readme=read('../README.md');
const html=read('../index.html');
const packageData=JSON.parse(read('../package.json'));

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

test('README begins with the module header and contains no profile avatar',()=>{
    equal(readme.startsWith('![strong-type JavaScript values passing through a native type-validation gate](./assets/strong-type-header.png)'),true);
    equal(/avatars\d*\.githubusercontent\.com/i.test(readme),false);
    equal(/RIAEvangelist\.png/i.test(readme),false);
});

test('README names every public validator',()=>{
    const missing=[...documentedCore,...documentedNode].filter(name=>!readme.includes(name));
    equal(missing.length,0,`missing README methods: ${missing.join(', ')}`);
});

test('the documentation site contains every required section',()=>{
    const ids=['start','guarantees','install','quick-start','modes','entry-points','types','core','unions','node','extend','playground','support','development'];
    const missing=ids.filter(id=>!html.includes(`id="${id}"`));
    equal(missing.length,0,`missing site sections: ${missing.join(', ')}`);
});

test('the site loads no remote script, stylesheet, font, or image',()=>{
    equal(/<(script|link|img)[^>]+https?:\/\//i.test(html),false);
    equal(/@import\s+url\(\s*['"]?https?:\/\//i.test(read('../docs.css')),false);
});

test('the playground imports the local isomorphic module without a bundle',()=>{
    const frame=read('../playground/frame.html');
    const runner=read('../playground/runner.js');
    equal(frame.includes('"strong-type": "../index.js"'),true);
    equal(runner.includes("import Is from 'strong-type'"),true);
    equal(frame.includes('node.js'),false);
});

test('package metadata has no dependencies and preserves every entry path',()=>{
    equal(Object.prototype.hasOwnProperty.call(packageData,'dependencies'),false);
    equal(Object.prototype.hasOwnProperty.call(packageData,'devDependencies'),false);
    equal(packageData.exports['.'],'./index.js');
    equal(packageData.exports['./index.js'],'./index.js');
    equal(packageData.exports['./node'],'./node.js');
    equal(packageData.exports['./node.js'],'./node.js');
});

test('all static website files exist',()=>{
    const files=['../docs.css','../docs.js','../docs/reference.js','../playground/frame.html','../playground/playground.css','../playground/runner.js','../assets/strong-type-header.png','../scripts/serve.js'];
    const missing=files.filter(path=>!fs.existsSync(new URL(path,import.meta.url)));
    equal(missing.length,0,`missing static files: ${missing.join(', ')}`);
});

run().catch(err=>{
    console.error(err);
    process.exitCode=1;
});
