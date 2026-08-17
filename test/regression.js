import Is from '../index.js';
import IsNode from '../node.js';
import * as vm from 'node:vm';
import {equal,suite,test} from './harness.js';

suite('Regression');

const weakIs=new Is(false);
const weakNodeIs=new IsNode(false);

test('compare does not coerce a numeric string',()=>equal(weakIs.compare(1,'1'),false));
test('compare distinguishes null from undefined',()=>equal(weakIs.compare(null,undefined),false));
test('finite rejects numeric strings without coercion',()=>equal(weakIs.finite('1'),false));
test('finite rejects null without coercion',()=>equal(weakIs.finite(null),false));
test('finite rejects BigInt without leaking a native error',()=>equal(weakIs.finite(1n),false));

test('uint8Array rejects a spoofed Symbol.toStringTag',()=>equal(weakIs.uint8Array({[Symbol.toStringTag]:'Uint8Array'}),false));
test('date rejects a spoofed Symbol.toStringTag',()=>equal(weakIs.date({[Symbol.toStringTag]:'Date'}),false));
test('map rejects a spoofed Symbol.toStringTag',()=>equal(weakIs.map({[Symbol.toStringTag]:'Map'}),false));

const realmValues=vm.runInNewContext('({date:new Date, map:new Map, set:new Set, regexp:/type/u, buffer:new ArrayBuffer(8), typed:new Uint8Array(2)})');
test('date accepts a value from another realm',()=>equal(weakIs.date(realmValues.date),true));
test('map accepts a value from another realm',()=>equal(weakIs.map(realmValues.map),true));
test('set accepts a value from another realm',()=>equal(weakIs.set(realmValues.set),true));
test('regExp accepts a value from another realm',()=>equal(weakIs.regExp(realmValues.regexp),true));
test('arrayBuffer accepts a value from another realm',()=>equal(weakIs.arrayBuffer(realmValues.buffer),true));
test('uint8Array accepts a value from another realm',()=>equal(weakIs.uint8Array(realmValues.typed),true));

const revokedProxy=function(){
    const pair=Proxy.revocable({},{});
    pair.revoke();
    return pair.proxy;
};

test('array returns false for a revoked proxy',()=>equal(weakIs.array(revokedProxy()),false));
test('date returns false for a revoked proxy',()=>equal(weakIs.date(revokedProxy()),false));
test('promise returns false for a revoked proxy',()=>equal(weakIs.promise(revokedProxy()),false));
test('nullPrototypeObject returns false for a revoked proxy',()=>equal(weakIs.nullPrototypeObject(revokedProxy()),false));
test('arrayBufferView returns false for a revoked proxy',()=>equal(weakIs.arrayBufferView(revokedProxy()),false));
test('nodeStream returns false for a revoked proxy',()=>equal(weakNodeIs.nodeStream(revokedProxy()),false));
test('eventEmitter returns false for a revoked proxy',()=>equal(weakNodeIs.eventEmitter(revokedProxy()),false));
test('nativeError returns false for a revoked proxy',()=>equal(weakNodeIs.nativeError(revokedProxy()),false));

test('cleanup drains remaining callbacks after one fails',async()=>{
    const isolated=await import('./harness.js?cleanup-drain-regression');
    let drained=false;
    isolated.after(()=>{drained=true;});
    isolated.after(()=>{throw new Error('expected cleanup failure');});
    try{
        await isolated.cleanup();
    }catch(err){
        // The first cleanup error is rethrown only after every callback runs.
    }
    equal(drained,true);
});
