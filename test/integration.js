import Is from 'strong-type';
import IsNode from 'strong-type/node';
import {coreMethods,nodeRows,validatorGroups} from '../docs/reference.js';
import * as fs from 'node:fs';
import {equal,suite,test} from './harness.js';
import {suiteNames,suites} from './suites.js';

suite('Integration');

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
const documentedHelpers=coreMethods.map(current=>current.method.split('(')[0]);
const readme=read('../README.md');
const packageData=JSON.parse(read('../package.json'));
const coverageConfig=JSON.parse(read('../vanilla-test.config.json'));
const browserConfig=JSON.parse(read('../vanilla-test.browser.config.json'));
const requiredBrowserPhrase='works with bundlers and without a bundler';

const localTargets=function(html){
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

const importMapContract=function(relative){
    const source=read(relative);
    const importMap=/<script\b[^>]*\btype=["']importmap["'][^>]*>([\s\S]*?)<\/script>/i.exec(source);
    const moduleScript=/<script\b[^>]*\btype=["']module["'][^>]*>/i.exec(source);
    if(!importMap || !moduleScript){
        return null;
    }
    return {
        map:JSON.parse(importMap[1]),
        mapIndex:importMap.index,
        moduleIndex:moduleScript.index
    };
};

const importMapTargetExists=function(relative,target){
    return fs.existsSync(new URL(target,new URL(relative,import.meta.url)));
};

const encodedImportMapPrecedesModule=function(source){
    const mapIndex=source.indexOf('&lt;script type="importmap"&gt;');
    const moduleIndex=source.indexOf('&lt;script type="module"&gt;',mapIndex);
    return mapIndex >= 0 && moduleIndex > mapIndex;
};

test('reference lists 183 isomorphic validators',()=>equal(documentedCore.length,183));
test('runtime exposes 183 isomorphic validators',()=>equal(coreNames.length,183));
for(const name of coreNames){
    test(`reference documents core validator ${name} exactly once`,()=>equal(documentedCore.filter(current=>current === name).length,1));
}

test('reference lists 18 Node validators',()=>equal(documentedNode.length,18));
test('runtime exposes 18 Node validators',()=>equal(nodeNames.length,18));
for(const name of nodeNames){
    test(`reference documents Node validator ${name} exactly once`,()=>equal(documentedNode.filter(current=>current === name).length,1));
}

test('reference lists 11 public helpers',()=>equal(documentedHelpers.length,helperNames.size));
for(const name of helperNames){
    test(`reference documents public helper ${name} exactly once`,()=>equal(documentedHelpers.filter(current=>current === name).length,1));
}

for(const name of documentedCore){
    test(`README names core validator ${name}`,()=>equal(readme.includes(name),true));
}
for(const name of documentedNode){
    test(`README names Node validator ${name}`,()=>equal(readme.includes(name),true));
}
for(const pageName of pageNames.slice(1)){
    test(`README links documentation page ${pageName}`,()=>equal(readme.includes(pageName),true));
}
test('README uses the local project header',()=>equal(readme.startsWith('![strong-type JavaScript values passing through a native type-validation gate](./assets/strong-type-header.png)'),true));
test('README contains the tests and coverage section',()=>equal(readme.includes('## Tests and coverage'),true));
test('README includes a native module script example',()=>equal(readme.includes('<script type="module">'),true));
test('README states the bundler and no-bundler contract',()=>equal(readme.includes(requiredBrowserPhrase),true));
test('README maps the bare package to the normal npm layout',()=>equal(readme.includes('"strong-type": "./node_modules/strong-type/index.js"'),true));
test('README places its import map before its module script',()=>equal(readme.indexOf('<script type="importmap">') < readme.indexOf('<script type="module">'),true));
test('README explains document-relative import-map paths',()=>equal(readme.includes('relative to the HTML document'),true));
test('README requires HTTP(S) and server exposure',()=>equal(readme.includes('over HTTP(S)') && readme.includes('server to expose'),true));
test('README rejects file protocol module loading',()=>equal(readme.includes('`file://` is not a supported'),true));
test('README publishes the current executable-line coverage snapshot',()=>equal(readme.includes('90.96%'),true));
test('README does not load a GitHub profile avatar',()=>equal(/avatars\d*\.githubusercontent\.com/i.test(readme),false));
test('README does not reference a profile image file',()=>equal(/RIAEvangelist\.png/i.test(readme),false));

const requiredSections={
    'index.html':['start','guarantees','install','quick-start','browser-use','entry-points','quality','explore'],
    'reference.html':['reference','types','core','unions','node','support'],
    'testing.html':['testing','coverage','suites','ci','commands','limits'],
    'playground.html':['playground','recipes','browser-module']
};
for(const [pageName,ids] of Object.entries(requiredSections)){
    for(const id of ids){
        test(`${pageName} contains section ${id}`,()=>equal(pages.get(pageName).includes(`id="${id}"`),true));
    }
}

for(const [pageName,html] of pages){
    for(const target of new Set(localTargets(html))){
        test(`${pageName} resolves local target ${target}`,()=>equal(localTargetExists(pageName,target),true));
    }
}

for(const [pageName,html] of pages){
    test(`${pageName} loads no remote script, stylesheet, or image`,()=>equal(/<(script|link|img)[^>]+https?:\/\//i.test(html),false));
}
test('docs.css imports no remote stylesheet or font',()=>equal(/@import\s+url\(\s*['"]?https?:\/\//i.test(read('../docs.css')),false));

for(const [name,source] of [
    ['README.md',readme],
    ['index.html',pages.get('index.html')],
    ['reference.html',pages.get('reference.html')],
    ['testing.html',pages.get('testing.html')],
    ['playground.html',pages.get('playground.html')],
    ['MIGRATION.md',read('../MIGRATION.md')],
    ['CHANGELOG.md',read('../CHANGELOG.md')],
    ['example/web/index.html',read('../example/web/index.html')],
    ['test/browser.html',read('../test/browser.html')]
]){
    test(`${name} states the bundler and no-bundler contract`,()=>equal(source.includes(requiredBrowserPhrase),true));
}

for(const [name,source] of [
    ['index.html',pages.get('index.html')],
    ['playground.html',pages.get('playground.html')],
    ['testing.html',pages.get('testing.html')]
]){
    test(`${name} shows the normal npm-layout package mapping`,()=>equal(source.includes('"strong-type": "./node_modules/strong-type/index.js"'),true));
    test(`${name} places the documented import map before its module script`,()=>equal(encodedImportMapPrecedesModule(source),true));
    test(`${name} documents HTTP(S), server exposure, and unsupported file protocol`,()=>equal(source.includes('HTTP(S)') && source.includes('server') && source.includes('file://'),true));
}

const frame=read('../playground/frame.html');
const playgroundRunner=read('../playground/runner.js');
const explicitBrowserMaps=[
    ['../playground/frame.html','../index.js'],
    ['../test/browser.html','../index.js'],
    ['../example/web/index.html','../../index.js']
];
for(const [relative,target] of explicitBrowserMaps){
    test(`${relative.replace('../','')} contains a valid import map`,()=>equal(Boolean(importMapContract(relative)),true));
    test(`${relative.replace('../','')} maps the bare package to ${target}`,()=>equal(importMapContract(relative).map.imports['strong-type'],target));
    test(`${relative.replace('../','')} places its import map before its module script`,()=>equal(importMapContract(relative).mapIndex < importMapContract(relative).moduleIndex,true));
    test(`${relative.replace('../','')} resolves its mapped package file`,()=>equal(importMapTargetExists(relative,target),true));
}
test('playground runner imports the package name',()=>equal(playgroundRunner.includes("import Is from 'strong-type'"),true));
test('playground does not import the Node adapter',()=>equal(frame.includes('node.js'),false));
test('package has no runtime dependencies',()=>equal(Object.prototype.hasOwnProperty.call(packageData,'dependencies'),false));
for(const field of ['optionalDependencies','peerDependencies','bundledDependencies']){
    test(`package has no ${field}`,()=>equal(Object.prototype.hasOwnProperty.call(packageData,field),false));
}
test('package has one development dependency',()=>equal(Object.keys(packageData.devDependencies).length,1));
test('package pins vanilla-test 2.1.0',()=>equal(packageData.devDependencies['vanilla-test'],'2.1.0'));
test('package declares the shared native browser entry',()=>equal(packageData.browser,'./index.js'));
test('browser metadata and root export use one implementation',()=>equal(packageData.browser,packageData.exports['.']));
test('package exports the default core entry',()=>equal(packageData.exports['.'],'./index.js'));
test('package exports the explicit core entry',()=>equal(packageData.exports['./index.js'],'./index.js'));
test('package exports the default Node entry',()=>equal(packageData.exports['./node'],'./node.js'));
test('package exports the explicit Node entry',()=>equal(packageData.exports['./node.js'],'./node.js'));

const coreSource=read('../index.js');
test('default module imports no node-prefixed built-in',()=>equal(coreSource.includes("from 'node:"),false));
test('default module contains no CommonJS require call',()=>equal(coreSource.includes('require('),false));
test('default module contains no consumer-parent dependency import',()=>equal(/(?:from\s*|import\s*)['"]\.\.\//.test(coreSource),false));
test('package self-reference resolves the native core entry',async()=>equal((await import('strong-type')).default,Is));
test('package self-reference resolves the native Node entry',async()=>equal((await import('strong-type/node')).default,IsNode));

for(const relative of ['unit.js','functional.js','behavioral.js','behavioral-core.js','integration.js','regression.js']){
    const source=read(`../test/${relative}`);
    test(`${relative} does not reach a package entry through the consumer parent`,()=>equal(/from\s+['"]\.\.\/(?:index|node)\.js['"]/.test(source),false));
}
test('shared behavioral inventory imports the bare package name',()=>equal(read('../test/behavioral-core.js').startsWith("import Is from 'strong-type';"),true));
test('shared native-browser entry reuses the behavioral inventory',()=>equal(read('../test/native-browser-entry.js').includes("from './behavioral-core.js'"),true));
test('web example imports the bare package name',()=>equal(read('../example/typeSupport.js').startsWith("import Is from 'strong-type';"),true));

const requiredFiles=[
    '../docs.css',
    '../docs.js',
    '../docs/reference.js',
    '../playground/frame.html',
    '../playground/playground.css',
    '../playground/runner.js',
    '../assets/strong-type-header.png',
    '../scripts/serve.js',
    '../scripts/test.js',
    '../test/harness.js',
    '../test/entry.js',
    '../test/suites.js',
    '../test/unit.js',
    '../test/functional.js',
    '../test/behavioral.js',
    '../test/behavioral-core.js',
    '../test/native-browser-entry.js',
    '../test/browser.html',
    '../test/integration.js',
    '../test/regression.js',
    '../node.cmd',
    '../vanilla-test.config.json',
    '../vanilla-test.browser.config.json',
    '../scripts/check-browser-contract.js',
    '../scripts/package-test.js',
    '../CHANGELOG.md',
    '../MIGRATION.md'
];
for(const path of requiredFiles){
    test(`required project file exists: ${path.replace('../','')}`,()=>equal(fs.existsSync(new URL(path,import.meta.url)),true));
}

test('harness dynamically imports vanilla-test',()=>equal(read('../test/harness.js').includes("import('vanilla-test')"),true));
test('coverage uses the vanilla-test Node collector',()=>equal(packageData.scripts.coverage,'vanilla-test coverage node'));
test('coverage entry is the aggregate test module',()=>equal(coverageConfig.entry,'./test/entry.js'));
test('coverage includes index.js',()=>equal(coverageConfig.node.include.includes('index.js'),true));
test('coverage includes node.js',()=>equal(coverageConfig.node.include.includes('node.js'),true));
test('coverage enforces executable-range minimums',()=>equal(coverageConfig.thresholds.statements,85));
test('coverage enforces block-range minimums',()=>equal(coverageConfig.thresholds.branches,65));
test('coverage enforces function-range minimums',()=>equal(coverageConfig.thresholds.functions,90));
test('coverage enforces executable-line minimums',()=>equal(coverageConfig.thresholds.lines,90));
test('browser conformance entry is the shared inventory adapter',()=>equal(browserConfig.entry,'./test/native-browser-entry.js'));
test('browser conformance includes only the shared runtime source in Node',()=>equal(JSON.stringify(browserConfig.node.include),JSON.stringify(['index.js'])));
test('browser conformance includes only the shared runtime source in Chrome',()=>equal(JSON.stringify(browserConfig.chrome.include),JSON.stringify(['index.js'])));
test('Chrome resolves the bare package to this checkout',()=>equal(browserConfig.chrome.imports['strong-type'],'./index.js'));
test('Chrome conformance runs headless',()=>equal(browserConfig.chrome.headless,true));

for(const name of suiteNames){
    const label=suites[name].label;
    test(`suite manifest labels ${name} as ${label}`,()=>equal(typeof label === 'string' && label.length > 0,true));
    test(`suite manifest maps ${name} to its module`,()=>equal(suites[name].module,`./${name}.js`));
    test(`package exposes test:${name}`,()=>equal(packageData.scripts[`test:${name}`],`node scripts/test.js ${name}`));
    test(`README exposes the ${label} suite`,()=>equal(readme.includes(`| ${label} |`),true));
    test(`testing page exposes the ${label} suite`,()=>equal(pages.get('testing.html').includes(`>${label}<`),true));
}

const ciWorkflow=read('../.github/workflows/ci.yml');
test('CI runs the coverage command',()=>equal(ciWorkflow.includes('npm run coverage'),true));
test('CI runs the legacy compatibility command',()=>equal(ciWorkflow.includes('npm run test:legacy'),true));
test('CI runs the shared Node and real Chrome inventory',()=>equal(ciWorkflow.includes('npm run test:conformance'),true));
test('CI verifies the static browser contract',()=>equal(ciWorkflow.includes('npm run test:browser-contract'),true));
test('CI installs and exercises the packed consumer',()=>equal(ciWorkflow.includes('npm run test:package'),true));
test('CI audits production and complete dependency trees',()=>equal(ciWorkflow.includes('npm audit --omit=dev') && /^[^\S\r\n]*-[^\S\r\n]+run:[^\S\r\n]+npm audit[^\S\r\n]*$/m.test(ciWorkflow),true));
const pagesWorkflow=read('../.github/workflows/pages.yml');
for(const pageName of pageNames){
    test(`Pages deployment includes ${pageName}`,()=>equal(pagesWorkflow.includes(pageName),true));
}
test('Pages deployment includes the native-browser fixture',()=>equal(pagesWorkflow.includes('test/browser.html test/behavioral-core.js'),true));
test('Pages deployment verifies the assembled browser contract',()=>equal(pagesWorkflow.includes('test:browser-contract -- _site'),true));
test('Pages deployment includes the browser example',()=>equal(pagesWorkflow.includes('assets docs playground example'),true));
const publishWorkflow=read('../.github/workflows/npm-publish.yml');
test('npm publishing is manually dispatched after exact-commit CI',()=>equal(publishWorkflow.includes('workflow_dispatch:') && !publishWorkflow.includes('types: [created]'),true));
test('npm publishing requires exact commit and version inputs',()=>equal(publishWorkflow.includes('EXPECTED_COMMIT') && publishWorkflow.includes('EXPECTED_VERSION'),true));
test('npm publishing verifies origin main is the candidate commit',()=>equal(publishWorkflow.includes('git rev-parse origin/main'),true));
test('npm publishing reruns Node and Chrome conformance',()=>equal(publishWorkflow.includes('npm run test:conformance'),true));
test('npm publishing verifies registry gitHead and integrity',()=>equal(publishWorkflow.includes('gitHead dist.integrity') && publishWorkflow.includes('EXPECTED_COMMIT'),true));
test('coverage reports are ignored by Git',()=>equal(read('../.gitignore').split(/\r?\n/).includes('/coverage/'),true));
