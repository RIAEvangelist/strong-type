import Is from '../index.js';
import IsNode from '../node.js';
import * as vm from 'node:vm';
import {equal,suite,test} from './harness.js';

suite('Regression');

const weakIs=new Is(false);
const weakNodeIs=new IsNode(false);

test('compare does not coerce or stringify a successful target',()=>{
    equal(weakIs.compare(1,'1'),false);
    const target={toString(){throw new Error('successful compare must not stringify');}};
    equal(weakIs.compare(target,target),true);
    class CustomCompare extends Is{
        check(){
            return 'custom check';
        }
    }
    equal(new CustomCompare(false).compare(target,target),'custom check');
    equal(new CustomCompare(false).compare(1,2,'two'),'custom check');
});
test('compare distinguishes null from undefined',()=>equal(weakIs.compare(null,undefined),false));
test('finite rejects numeric strings without coercion',()=>equal(weakIs.finite('1'),false));
test('finite rejects null without coercion',()=>equal(weakIs.finite(null),false));
test('finite rejects BigInt without leaking a native error',()=>equal(weakIs.finite(1n),false));

test('typed-array and boxed checks reject spoofed Symbol.toStringTag values',()=>{
    equal(weakIs.uint8Array({[Symbol.toStringTag]:'Uint8Array'}),false);
    equal(weakIs.boxedPrimitive({[Symbol.toStringTag]:'Number'}),false);
    const boxedNumber=Object(1);
    boxedNumber[Symbol.toStringTag]='String';
    equal(weakIs.boxedPrimitive(boxedNumber),true);
    let tagReads=0;
    const hostileTag=Object(2);
    Object.defineProperty(hostileTag,Symbol.toStringTag,{get(){tagReads++;throw new Error('hostile tag');}});
    equal(weakIs.boxedPrimitive(hostileTag),true);
    equal(tagReads,0);
    const prototypeLessBigInt=Object(1n);
    Object.setPrototypeOf(prototypeLessBigInt,null);
    equal(weakIs.boxedPrimitive(prototypeLessBigInt),true);
    const prototypeLessSymbol=Object(Symbol('type'));
    Object.setPrototypeOf(prototypeLessSymbol,null);
    equal(weakIs.boxedPrimitive(prototypeLessSymbol),true);
});
test('date rejects a spoofed Symbol.toStringTag',()=>equal(weakIs.date({[Symbol.toStringTag]:'Date'}),false));
test('map rejects spoofed tags and proxies without Map slots',()=>{
    equal(weakIs.map({[Symbol.toStringTag]:'Map'}),false);
    equal(weakIs.map(new Proxy(new Map,{})),false);
    const prototypeLessMap=new Map;
    Object.setPrototypeOf(prototypeLessMap,null);
    equal(weakIs.map(prototypeLessMap),true);
});

const realmValues=vm.runInNewContext(`({
    array:[],
    date:new Date,
    invalidDate:new Date(NaN),
    map:new Map,
    set:new Set,
    regexp:/type/u,
    buffer:new ArrayBuffer(8),
    dataView:new DataView(new ArrayBuffer(8)),
    typed:new Uint8Array(2),
    boxed:[Object(true),Object(1),Object(1n),Object('type'),Object(Symbol('type'))],
    segments:typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('en').segment('strong type') : false
})`);
test('array and dates accept valid values from another realm',()=>{
    equal(weakIs.array(realmValues.array),true);
    equal(weakIs.date(realmValues.date),true);
    equal(weakIs.validDate(realmValues.date),true);
    equal(weakIs.validDate(realmValues.invalidDate),false);
});
test('map accepts a value from another realm',()=>equal(weakIs.map(realmValues.map),true));
test('set accepts a value from another realm',()=>equal(weakIs.set(realmValues.set),true));
test('regExp accepts a value from another realm',()=>equal(weakIs.regExp(realmValues.regexp),true));
test('array-buffer values preserve exact brands across realms',()=>{
    equal(weakIs.arrayBuffer(realmValues.buffer),true);
    equal(weakIs.dataView(realmValues.dataView),true);
    equal(weakIs.typedArray(realmValues.dataView),false);
    equal(weakIs.resizableArrayBuffer({resizable:true}),false);
    equal(weakIs.growableSharedArrayBuffer({growable:true}),false);
    const prototypeLessBuffer=new ArrayBuffer(8);
    Object.setPrototypeOf(prototypeLessBuffer,null);
    equal(weakIs.arrayBuffer(prototypeLessBuffer),true);
    const prototypeLessView=new DataView(new ArrayBuffer(8));
    Object.setPrototypeOf(prototypeLessView,null);
    equal(weakIs.dataView(prototypeLessView),true);
});
test('typed arrays, boxed primitives, and Segments work across realms',()=>{
    equal(weakIs.uint8Array(realmValues.typed),true);
    for(const value of realmValues.boxed){
        equal(weakIs.boxedPrimitive(value),true);
    }
    if(realmValues.segments){
        equal(weakIs.intlSegments(realmValues.segments),true);
        equal(weakIs.intlSegments({containing(){}}),false);
        const shadowedSegments=new Intl.Segmenter('en').segment('strong type');
        Object.defineProperty(shadowedSegments,'containing',{value:null});
        equal(weakIs.intlSegments(shadowedSegments),true);
        const prototypeLessFormat=new Intl.DateTimeFormat('en');
        Object.setPrototypeOf(prototypeLessFormat,null);
        equal(weakIs.intlDateTimeFormat(prototypeLessFormat),true);
    }
});

const revokedProxy=function(){
    const pair=Proxy.revocable({},{});
    pair.revoke();
    return pair.proxy;
};

test('array and typed-array checks return false for revoked proxies',()=>{
    equal(weakIs.array(revokedProxy()),false);
    equal(weakIs.uint8Array(revokedProxy()),false);
});
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
