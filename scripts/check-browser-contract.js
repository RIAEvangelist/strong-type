import * as fs from 'node:fs';
import * as path from 'node:path';

const root=path.resolve(process.argv[2] || '.');
const requiredPhrase='works with bundlers and without a bundler';

const fail=function(message){
    throw new Error(`browser contract: ${message}`);
};

const read=function(relative){
    const file=path.resolve(root,relative);
    if(!fs.existsSync(file) || !fs.statSync(file).isFile()){
        fail(`missing ${relative}`);
    }
    return fs.readFileSync(file,'utf8');
};

const assert=function(condition,message){
    if(!condition){
        fail(message);
    }
};

const verifyGuidance=function(relative){
    const source=read(relative);
    const lower=source.toLowerCase();
    assert(source.includes(requiredPhrase),`${relative} must state the bundler and no-bundler contract`);
    assert(lower.includes('bundlers resolve'),`${relative} must explain normal bundler resolution`);
    assert(lower.includes('native browser esm'),`${relative} must explain native browser ESM resolution`);
    assert((lower.includes('no build') || lower.includes('without a build')) && lower.includes('transpil'),`${relative} must state that no build or transpilation is needed`);
    assert(lower.includes('relative') && source.includes('HTTP(S)') && lower.includes('server') && source.includes('file://'),`${relative} must state the path, server, HTTP(S), and file protocol boundaries`);
};

const verifyImportMap=function(relative,expectedTarget){
    const source=read(relative);
    const importMap=/<script\b[^>]*\btype=["']importmap["'][^>]*>([\s\S]*?)<\/script>/i.exec(source);
    const moduleScript=/<script\b[^>]*\btype=["']module["'][^>]*>/i.exec(source);
    assert(importMap,`${relative} must contain an explicit import map`);
    assert(moduleScript,`${relative} must contain a module script`);
    assert(importMap.index < moduleScript.index,`${relative} import map must precede its module script`);

    let data;
    try{
        data=JSON.parse(importMap[1]);
    }catch(error){
        fail(`${relative} import map must be valid JSON: ${error.message}`);
    }
    assert(data.imports && data.imports['strong-type'] === expectedTarget,`${relative} must map strong-type to ${expectedTarget}`);

    const resolved=path.resolve(path.dirname(path.resolve(root,relative)),expectedTarget);
    const withinRoot=path.relative(root,resolved);
    assert(withinRoot && !withinRoot.startsWith('..') && !path.isAbsolute(withinRoot),`${relative} strong-type mapping must stay inside the served root`);
    assert(fs.existsSync(resolved),`${relative} strong-type mapping must resolve to an existing file`);
};

const verifyDocumentedImportMap=function(relative,encoded=false){
    const source=read(relative);
    const importMapOpen=encoded ? '&lt;script type="importmap"&gt;' : '<script type="importmap">';
    const scriptClose=encoded ? '&lt;/script&gt;' : '</script>';
    const moduleOpen=encoded ? '&lt;script type="module"&gt;' : '<script type="module">';
    const mapIndex=source.indexOf(importMapOpen);
    const mapEnd=source.indexOf(scriptClose,mapIndex);
    const moduleIndex=source.indexOf(moduleOpen,mapEnd);
    assert(mapIndex >= 0 && mapEnd > mapIndex,`${relative} must show a complete npm-layout import map`);
    assert(moduleIndex > mapEnd,`${relative} documented import map must precede its module script`);

    let data;
    try{
        data=JSON.parse(source.slice(mapIndex+importMapOpen.length,mapEnd));
    }catch(error){
        fail(`${relative} documented import map must be valid JSON: ${error.message}`);
    }
    assert(data.imports && data.imports['strong-type'] === './node_modules/strong-type/index.js',`${relative} must document the normal npm package target`);
};

for(const page of ['index.html','reference.html','testing.html','playground.html']){
    verifyGuidance(page);
}

verifyImportMap('playground/frame.html','../index.js');
verifyImportMap('test/browser.html','../index.js');
for(const page of ['index.html','testing.html','playground.html']){
    verifyDocumentedImportMap(page,true);
}

if(fs.existsSync(path.resolve(root,'example/web/index.html'))){
    verifyGuidance('example/web/index.html');
    verifyImportMap('example/web/index.html','../../index.js');
}

if(fs.existsSync(path.resolve(root,'README.md'))){
    verifyGuidance('README.md');
    verifyGuidance('MIGRATION.md');
    verifyGuidance('CHANGELOG.md');
    assert(read('test/behavioral-core.js').includes("from 'strong-type'"),'shared behavioral inventory must import the bare package name');
    assert(!read('test/behavioral-core.js').includes("from '../index.js'"),'shared behavioral inventory must not import a consumer-relative package path');
    assert(read('example/typeSupport.js').includes("from 'strong-type'"),'shared example must import the bare package name');
    verifyDocumentedImportMap('README.md');
    verifyDocumentedImportMap('MIGRATION.md');
    const config=JSON.parse(read('vanilla-test.browser.config.json'));
    assert(config.chrome && config.chrome.imports && config.chrome.imports['strong-type'] === './index.js','Chrome conformance must override strong-type to the checkout root');
}

console.log(`browser contract: ${root}`);
console.log('explicit import maps and bare-package resolution verified');
