import Is from '../index.js';
import IsNode from '../node.js';
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
test('README publishes the current executable-line coverage snapshot',()=>equal(readme.includes('91.63%'),true));
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

const frame=read('../playground/frame.html');
const playgroundRunner=read('../playground/runner.js');
test('playground maps strong-type to the native core entry',()=>equal(frame.includes('"strong-type": "../index.js"'),true));
test('playground runner imports the package name',()=>equal(playgroundRunner.includes("import Is from 'strong-type'"),true));
test('playground does not import the Node adapter',()=>equal(frame.includes('node.js'),false));
test('package has no runtime dependencies',()=>equal(Object.prototype.hasOwnProperty.call(packageData,'dependencies'),false));
test('package has one development dependency',()=>equal(Object.keys(packageData.devDependencies).length,1));
test('package pins vanilla-test 2.1.0',()=>equal(packageData.devDependencies['vanilla-test'],'2.1.0'));
test('package exports the default core entry',()=>equal(packageData.exports['.'],'./index.js'));
test('package exports the explicit core entry',()=>equal(packageData.exports['./index.js'],'./index.js'));
test('package exports the default Node entry',()=>equal(packageData.exports['./node'],'./node.js'));
test('package exports the explicit Node entry',()=>equal(packageData.exports['./node.js'],'./node.js'));

const coreSource=read('../index.js');
test('default module imports no node-prefixed built-in',()=>equal(coreSource.includes("from 'node:"),false));
test('default module contains no CommonJS require call',()=>equal(coreSource.includes('require('),false));
test('package self-reference resolves the native core entry',async()=>equal((await import('strong-type')).default,Is));
test('package self-reference resolves the native Node entry',async()=>equal((await import('strong-type/node')).default,IsNode));

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
    '../test/integration.js',
    '../test/regression.js',
    '../node.cmd',
    '../vanilla-test.config.json'
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
const pagesWorkflow=read('../.github/workflows/pages.yml');
for(const pageName of pageNames){
    test(`Pages deployment includes ${pageName}`,()=>equal(pagesWorkflow.includes(pageName),true));
}
test('coverage reports are ignored by Git',()=>equal(read('../.gitignore').split(/\r?\n/).includes('/coverage/'),true));
