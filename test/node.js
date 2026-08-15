import Is from '../index.js';
import IsNode from '../node.js';
import * as stream from 'node:stream';
import * as events from 'node:events';
import * as crypto from 'node:crypto';
import * as util from 'node:util';
import * as vm from 'node:vm';
import * as fs from 'node:fs';
import {equal,run,skip,test,throws} from './harness.js';

const is=new IsNode;
const weakIs=new IsNode(false);

const verify=function(name,value,...invalidValues){
    const invalid=invalidValues.length ? invalidValues[0] : {};
    test(`${name} accepts its Node type`,()=>equal(is[name](value),true));
    test(`${name} returns false for a near miss`,()=>equal(weakIs[name](invalid),false));
    test(`${name} throws TypeError for a near miss`,()=>throws(()=>is[name](invalid),TypeError));
};

verify('buffer',Buffer.from('strong-type'),new Uint8Array);
verify('nodeStream',new stream.PassThrough,{});
verify('nodeReadable',new stream.Readable({read(){this.push(null);}}),{});
verify('nodeWritable',new stream.Writable({write(chunk,encoding,done){done();}}),{});
verify('nodeDuplex',new stream.Duplex({read(){this.push(null);},write(chunk,encoding,done){done();}}),{});
verify('nodeTransform',new stream.Transform({transform(chunk,encoding,done){done(null,chunk);}}),{});
verify('nodePassThrough',new stream.PassThrough,{});
verify('eventEmitter',new events.EventEmitter,{});

const timeout=setTimeout(()=>{},1000);
clearTimeout(timeout);
verify('timeout',timeout,{});

if(typeof setImmediate === 'function'){
    const immediate=setImmediate(()=>{});
    clearImmediate(immediate);
    verify('immediate',immediate,{});
}else{
    skip('immediate','setImmediate is not available');
}

if(typeof crypto.createSecretKey === 'function'){
    verify('keyObject',crypto.createSecretKey(Buffer.alloc(32)),{});
}else{
    skip('keyObject','KeyObject is not available');
}

test('x509Certificate is safely guarded',()=>{
    equal(weakIs.x509Certificate({}),false);
    throws(()=>is.x509Certificate({}),TypeError);
});

verify('proxy',new Proxy({},{}),{});
verify('nativeError',vm.runInNewContext('new TypeError("type")'),{});
verify('mapIterator',new Map().keys(),new Set().keys());
verify('setIterator',new Set().keys(),new Map().keys());

test('external is safely guarded when no fixture is available',()=>{
    equal(weakIs.external({}),false);
    throws(()=>is.external({}),TypeError);
});

test('Node validators return false for revoked proxies',()=>{
    const pair=Proxy.revocable({},{});
    pair.revoke();
    equal(weakIs.nodeStream(pair.proxy),false);
    equal(weakIs.eventEmitter(pair.proxy),false);
    equal(weakIs.nativeError(pair.proxy),false);
});

test('union rejects the Node adapter helper method',()=>{
    equal(weakIs.union({},'utilTypeCheck'),false);
    throws(()=>is.union({},'utilTypeCheck'),TypeError);
});

test('the default module remains free of Node imports',()=>{
    const source=fs.readFileSync(new URL('../index.js',import.meta.url),'utf8');
    equal(source.includes("from 'node:"),false);
    equal(source.includes('require('),false);
});

test('the Node adapter inherits every core validator',()=>{
    equal(is.string('type'),true);
    equal(is.url(new URL('https://example.com/')),true);
    equal(is.union(Buffer.from('type'),'buffer|string'),true);
});

test('core intrinsic checks work across Node vm realms',()=>{
    const values=vm.runInNewContext('({date:new Date, map:new Map, set:new Set, regexp:/type/u, buffer:new ArrayBuffer(8), typed:new Uint8Array(2)})');
    equal(new Is().date(values.date),true);
    equal(new Is().map(values.map),true);
    equal(new Is().set(values.set),true);
    equal(new Is().regExp(values.regexp),true);
    equal(new Is().arrayBuffer(values.buffer),true);
    equal(new Is().uint8Array(values.typed),true);
});

test('util.types detects a module namespace object',async()=>{
    const namespace=await import('../index.js');
    if(typeof util.types.isModuleNamespaceObject === 'function'){
        equal(is.moduleNamespaceObject(namespace),true);
    }else{
        equal(weakIs.moduleNamespaceObject(namespace),false);
    }
});

test('package self-reference resolves both native entry points',async()=>{
    const core=await import('strong-type');
    const node=await import('strong-type/node');
    equal(core.default,Is);
    equal(node.default,IsNode);
});

run().catch(err=>{
    console.error(err);
    process.exitCode=1;
});
