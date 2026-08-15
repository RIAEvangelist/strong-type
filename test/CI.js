import Is from '../index.js';
import {assert,equal,run,skip,test,throws} from './harness.js';

const is=new Is;
const weakIs=new Is(false);
const cleanup=[];

const verify=function(name,value,...invalidValues){
    const invalid=invalidValues.length ? invalidValues[0] : {};
    test(`${name} accepts its type`,()=>equal(is[name](value),true));
    test(`${name} returns false in non-strict mode`,()=>equal(weakIs[name](invalid),false));
    test(`${name} throws TypeError in strict mode`,()=>throws(()=>is[name](invalid),TypeError));
};

const guarded=function(name,constructor,create,invalid={}){
    if(typeof constructor !== 'function'){
        skip(name,'not available in this runtime');
        test(`${name} is safely guarded`,()=>{
            equal(weakIs[name](invalid),false);
            throws(()=>is[name](invalid),TypeError);
        });
        return;
    }

    let value;
    try{
        value=create(constructor);
    }catch(err){
        skip(name,`not safely constructible: ${err.message}`);
        return;
    }
    verify(name,value,invalid);
};

verify('defined',null,undefined);
verify('any',0,undefined);
verify('exists',false,undefined);
verify('finite',1,Infinity);
verify('finiteNumber',0,'0');
verify('NaN',NaN,0);
verify('nan',NaN,'NaN');
verify('null',null,undefined);
verify('nullish',undefined,0);
verify('boolean',false,0);
verify('bigInt',1n,1);
verify('bigint',1n,'1');
verify('number',1,1n);
verify('integer',1,1.1);
verify('safeInteger',Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER+1);
verify('infinity',Infinity,-Infinity);
verify('infinite',-Infinity,0);
verify('positiveInfinity',Infinity,-Infinity);
verify('negativeInfinity',-Infinity,Infinity);
verify('negativeZero',-0,0);
verify('string','strong-type',new String('strong-type'));
verify('symbol',Symbol('type'),'symbol');
verify('undefined',undefined,null);
verify('primitive',null,{});
verify('globalThis',globalThis,{});
verify('atomics',Atomics,{});
verify('json',JSON,{});
verify('math',Math,{});
verify('reflect',Reflect,{});

if(typeof JSON.isRawJSON === 'function'){
    verify('rawJSON',JSON.rawJSON('1'),{});
}else{
    guarded('rawJSON',false,()=>false);
}

verify('array',[],{});
verify('date',new Date,{});
verify('validDate',new Date,new Date(NaN));
verify('map',new Map,{});
verify('weakMap',new WeakMap,{});
verify('object',null,0);
verify('nonNullObject',{},null);
verify('plainObject',Object.create(null),[]);
verify('nullPrototypeObject',Object.create(null),{});
verify('argumentsObject',(function(){return arguments;})(),[]);
verify('promise',Promise.resolve(),{});
verify('thenable',{then(){}},{});
verify('regExp',/type/u,{});
verify('regexp',/type/u,'type');
verify('set',new Set,{});
verify('weakSet',new WeakSet,{});
verify('boxedPrimitive',Object(1),1);
verify('booleanObject',Object(true),true);
verify('numberObject',Object(1),1);
verify('bigIntObject',Object(1n),1n);
verify('stringObject',Object('type'),'type');
verify('symbolObject',Object(Symbol('type')),Symbol('type'));

verify('function',()=>{},{});
verify('callable',class Type{},{});
verify('asyncFunction',async()=>{},()=>{});
verify('generatorFunction',function*(){},()=>{});
verify('asyncGeneratorFunction',async function*(){},function*(){});
verify('generator',(function*(){yield true;})(),{});
verify('asyncGenerator',(async function*(){yield true;})(),{});
verify('iterator',[1][Symbol.iterator](),{});
verify('asyncIterator',(async function*(){yield true;})(),{});
verify('iterable',new Set,{});
verify('asyncIterable',(async function*(){yield true;})(),{});

verify('error',new Error,{});
guarded('aggregateError',globalThis.AggregateError,constructor=>new constructor([]));
verify('evalError',new EvalError,{});
verify('rangeError',new RangeError,{});
verify('referenceError',new ReferenceError,{});
verify('syntaxError',new SyntaxError,{});
verify('typeError',new TypeError,{});
verify('URIError',new URIError,{});
verify('uriError',new URIError,{});
guarded('suppressedError',globalThis.SuppressedError,constructor=>new constructor(new Error,new Error,'cleanup'));

verify('typedArray',new Uint8Array,new DataView(new ArrayBuffer(1)));
verify('arrayBufferView',new DataView(new ArrayBuffer(1)),{});
verify('bigInt64Array',new BigInt64Array,new BigUint64Array);
verify('bigUint64Array',new BigUint64Array,new BigInt64Array);
guarded('float16Array',globalThis.Float16Array,constructor=>new constructor,new Float32Array);
verify('float32Array',new Float32Array,new Float64Array);
verify('float64Array',new Float64Array,new Float32Array);
verify('int8Array',new Int8Array,new Uint8Array);
verify('int16Array',new Int16Array,new Uint16Array);
verify('int32Array',new Int32Array,new Uint32Array);
verify('uint8Array',new Uint8Array,new Int8Array);
verify('uint8ClampedArray',new Uint8ClampedArray,new Uint8Array);
verify('uint16Array',new Uint16Array,new Int16Array);
verify('uint32Array',new Uint32Array,new Int32Array);

verify('arrayBuffer',new ArrayBuffer(1),{});
guarded('sharedArrayBuffer',globalThis.SharedArrayBuffer,constructor=>new constructor(1));
verify('anyArrayBuffer',new ArrayBuffer(1),{});
verify('dataView',new DataView(new ArrayBuffer(1)),new Uint8Array);

const resizable=new ArrayBuffer(8,{maxByteLength:16});
if(resizable.resizable){
    verify('resizableArrayBuffer',resizable,new ArrayBuffer(8));
}else{
    skip('resizableArrayBuffer','resizable ArrayBuffer is not available');
}

if(typeof SharedArrayBuffer === 'function'){
    const growable=new SharedArrayBuffer(8,{maxByteLength:16});
    if(growable.growable){
        verify('growableSharedArrayBuffer',growable,new SharedArrayBuffer(8));
    }else{
        skip('growableSharedArrayBuffer','growable SharedArrayBuffer is not available');
    }
}

if(typeof structuredClone === 'function'){
    const detached=new ArrayBuffer(8);
    structuredClone(detached,{transfer:[detached]});
    verify('detachedArrayBuffer',detached,new ArrayBuffer(0));
}else{
    skip('detachedArrayBuffer','transferable structuredClone is not available');
}

verify('intlDateTimeFormat',new Intl.DateTimeFormat,{});
verify('intlCollator',new Intl.Collator,{});
guarded('intlDisplayNames',Intl.DisplayNames,constructor=>new constructor(['en'],{type:'region'}));
verify('intlListFormat',new Intl.ListFormat,{});
verify('intlLocale',new Intl.Locale('en'),{});
verify('intlNumberFormat',new Intl.NumberFormat,{});
verify('intlPluralRules',new Intl.PluralRules,{});
verify('intlRelativeTimeFormat',new Intl.RelativeTimeFormat,{});
guarded('intlSegmenter',Intl.Segmenter,constructor=>new constructor);
if(typeof Intl.Segmenter === 'function'){
    verify('intlSegments',new Intl.Segmenter().segment('strong type'),{});
}
guarded('intlDurationFormat',Intl.DurationFormat,constructor=>new constructor('en'));

const held={};
guarded('finalizationRegistry',globalThis.FinalizationRegistry,constructor=>new constructor(()=>{}));
guarded('weakRef',globalThis.WeakRef,constructor=>new constructor(held));

if(typeof Symbol.dispose === 'symbol'){
    verify('disposable',{[Symbol.dispose](){}},{});
}else{
    guarded('disposable',false,()=>false);
}

if(typeof Symbol.asyncDispose === 'symbol'){
    verify('asyncDisposable',{[Symbol.asyncDispose](){}},{});
}else{
    guarded('asyncDisposable',false,()=>false);
}

guarded('disposableStack',globalThis.DisposableStack,constructor=>new constructor);
guarded('asyncDisposableStack',globalThis.AsyncDisposableStack,constructor=>new constructor);

const temporalCases={
    temporalDuration:['Duration',constructor=>constructor.from({seconds:1})],
    temporalInstant:['Instant',constructor=>constructor.fromEpochMilliseconds(0)],
    temporalPlainDate:['PlainDate',constructor=>constructor.from('2026-08-14')],
    temporalPlainDateTime:['PlainDateTime',constructor=>constructor.from('2026-08-14T12:00')],
    temporalPlainMonthDay:['PlainMonthDay',constructor=>constructor.from('08-14')],
    temporalPlainTime:['PlainTime',constructor=>constructor.from('12:00')],
    temporalPlainYearMonth:['PlainYearMonth',constructor=>constructor.from('2026-08')],
    temporalZonedDateTime:['ZonedDateTime',constructor=>constructor.from('2026-08-14T12:00[UTC]')]
};

for(const [name,[type,create]] of Object.entries(temporalCases)){
    guarded(name,globalThis.Temporal && globalThis.Temporal[type],create);
}

const globalCases={
    url:['URL',constructor=>new constructor('https://example.com/')],
    urlSearchParams:['URLSearchParams',constructor=>new constructor('type=strong')],
    urlPattern:['URLPattern',constructor=>new constructor({pathname:'/types/:name'})],
    textEncoder:['TextEncoder',constructor=>new constructor],
    textDecoder:['TextDecoder',constructor=>new constructor],
    textEncoderStream:['TextEncoderStream',constructor=>new constructor],
    textDecoderStream:['TextDecoderStream',constructor=>new constructor],
    domException:['DOMException',constructor=>new constructor('type')],
    blob:['Blob',constructor=>new constructor(['type'])],
    file:['File',constructor=>new constructor(['type'],'type.txt')],
    formData:['FormData',constructor=>new constructor],
    headers:['Headers',constructor=>new constructor],
    request:['Request',constructor=>new constructor('https://example.com/')],
    response:['Response',constructor=>new constructor('type')],
    abortController:['AbortController',constructor=>new constructor],
    event:['Event',constructor=>new constructor('type')],
    eventTarget:['EventTarget',constructor=>new constructor],
    customEvent:['CustomEvent',constructor=>new constructor('type')],
    messageEvent:['MessageEvent',constructor=>new constructor('type')],
    closeEvent:['CloseEvent',constructor=>new constructor('close')],
    errorEvent:['ErrorEvent',constructor=>new constructor('error')],
    readableStream:['ReadableStream',constructor=>new constructor],
    writableStream:['WritableStream',constructor=>new constructor],
    transformStream:['TransformStream',constructor=>new constructor],
    byteLengthQueuingStrategy:['ByteLengthQueuingStrategy',constructor=>new constructor({highWaterMark:16})],
    countQueuingStrategy:['CountQueuingStrategy',constructor=>new constructor({highWaterMark:1})],
    compressionStream:['CompressionStream',constructor=>new constructor('gzip')],
    decompressionStream:['DecompressionStream',constructor=>new constructor('gzip')],
    performanceObserver:['PerformanceObserver',constructor=>new constructor(()=>{})]
};

for(const [name,[type,create]] of Object.entries(globalCases)){
    guarded(name,globalThis[type],create);
}

if(typeof AbortController === 'function'){
    verify('abortSignal',new AbortController().signal,{});
}

if(typeof BroadcastChannel === 'function'){
    const channel=new BroadcastChannel('strong-type-test');
    cleanup.push(()=>channel.close());
    verify('broadcastChannel',channel,{});
}

if(typeof MessageChannel === 'function'){
    const channel=new MessageChannel;
    cleanup.push(()=>channel.port1.close());
    cleanup.push(()=>channel.port2.close());
    verify('messageChannel',channel,{});
    verify('messagePort',channel.port1,{});
}

guarded('webSocket',false,()=>false);
guarded('eventSource',false,()=>false);

if(Object.prototype.hasOwnProperty.call(globalThis,'navigator')){
    verify('navigator',globalThis.navigator,{});
}else{
    guarded('navigator',false,()=>false);
}
guarded('storage',globalThis.Storage,constructor=>globalThis.localStorage || new constructor);

if(typeof ReadableStream === 'function'){
    const stream=new ReadableStream;
    const reader=stream.getReader();
    verify('readableStreamDefaultReader',reader,{});
    reader.releaseLock();

    let defaultController;
    new ReadableStream({start(controller){defaultController=controller;}});
    verify('readableStreamDefaultController',defaultController,{});

    let byteController;
    const byteStream=new ReadableStream({type:'bytes',start(controller){byteController=controller;}});
    verify('readableByteStreamController',byteController,{});
    const byobReader=byteStream.getReader({mode:'byob'});
    verify('readableStreamBYOBReader',byobReader,{});
    byobReader.releaseLock();
}

guarded('readableStreamBYOBRequest',false,()=>false);

if(typeof WritableStream === 'function'){
    const stream=new WritableStream;
    const writer=stream.getWriter();
    verify('writableStreamDefaultWriter',writer,{});
    writer.releaseLock();

    let controller;
    new WritableStream({start(value){controller=value;}});
    verify('writableStreamDefaultController',controller,{});
}

if(typeof TransformStream === 'function'){
    let controller;
    new TransformStream({start(value){controller=value;}});
    verify('transformStreamDefaultController',controller,{});
}

if(Object.prototype.hasOwnProperty.call(globalThis,'crypto')){
    verify('crypto',globalThis.crypto,{});
    if(globalThis.crypto.subtle){
        verify('subtleCrypto',globalThis.crypto.subtle,{});
    }
}

if(Object.prototype.hasOwnProperty.call(globalThis,'performance')){
    verify('performance',globalThis.performance,{});
    if(typeof performance.mark === 'function'){
        verify('performanceMark',performance.mark('strong-type-test'),{});
        performance.clearMarks('strong-type-test');
    }
}

guarded('cryptoKey',globalThis.CryptoKey,constructor=>Object.create(constructor.prototype));
guarded('performanceEntry',globalThis.PerformanceEntry,constructor=>Object.create(constructor.prototype));
guarded('performanceMeasure',globalThis.PerformanceMeasure,constructor=>Object.create(constructor.prototype));
guarded('performanceObserverEntryList',globalThis.PerformanceObserverEntryList,constructor=>Object.create(constructor.prototype));
guarded('performanceResourceTiming',globalThis.PerformanceResourceTiming,constructor=>Object.create(constructor.prototype));

const wasm=globalThis.WebAssembly;
if(wasm){
    const module=new wasm.Module(new Uint8Array([0,97,115,109,1,0,0,0]));
    verify('webAssemblyModule',module,{});
    verify('webAssemblyInstance',new wasm.Instance(module),{});
    verify('webAssemblyMemory',new wasm.Memory({initial:1}),{});
    verify('webAssemblyTable',new wasm.Table({initial:0,element:'anyfunc'}),{});
    verify('webAssemblyGlobal',new wasm.Global({value:'i32'},0),{});
    guarded('webAssemblyTag',wasm.Tag,constructor=>new constructor({parameters:[]}));
    if(typeof wasm.Tag === 'function' && typeof wasm.Exception === 'function'){
        const tag=new wasm.Tag({parameters:[]});
        verify('webAssemblyException',new wasm.Exception(tag,[]),{});
    }else{
        guarded('webAssemblyException',false,()=>false);
    }
    verify('webAssemblyCompileError',new wasm.CompileError,{});
    verify('webAssemblyLinkError',new wasm.LinkError,{});
    verify('webAssemblyRuntimeError',new wasm.RuntimeError,{});
}

test('strict constructor is the default',()=>equal(new Is().strict,true));
test('non-strict constructor is explicit',()=>equal(new Is(false).strict,false));
test('compare is strict and does not coerce',()=>{
    equal(weakIs.compare(1,'1'),false);
    equal(weakIs.compare(null,undefined),false);
});
test('finite does not coerce or throw for BigInt',()=>{
    equal(weakIs.finite('1'),false);
    equal(weakIs.finite(null),false);
    equal(weakIs.finite(1n),false);
});
test('brand checks reject Symbol.toStringTag spoofing',()=>{
    const spoof={[Symbol.toStringTag]:'Uint8Array'};
    equal(weakIs.uint8Array(spoof),false);
    equal(weakIs.date({[Symbol.toStringTag]:'Date'}),false);
    equal(weakIs.map({[Symbol.toStringTag]:'Map'}),false);
});
test('non-strict checks return false for revoked proxies',()=>{
    const pair=Proxy.revocable({},{});
    pair.revoke();
    equal(weakIs.array(pair.proxy),false);
    equal(weakIs.date(pair.proxy),false);
    equal(weakIs.promise(pair.proxy),false);
    equal(weakIs.nullPrototypeObject(pair.proxy),false);
    equal(weakIs.arrayBufferView(pair.proxy),false);
});
test('union trims names and invokes a matching validator',()=>{
    equal(is.union('type',' string | number '),true);
    equal(is.union(1,['string','number']),true);
});
test('union returns false or throws when no type matches',()=>{
    equal(weakIs.union({},'string|number'),false);
    throws(()=>is.union({},'string|number'),TypeError);
});
test('union rejects inherited Object methods',()=>{
    equal(weakIs.union({},'toString'),false);
    throws(()=>is.union({},'toString'),TypeError);
});
test('union supports custom validators and calls the winner once',()=>{
    let calls=0;
    class CustomIs extends Is{
        custom(value){
            calls++;
            return this.check(value,value === 'custom','custom');
        }
    }
    equal(new CustomIs().union('custom','number|custom'),true);
    equal(calls,1);
});

run().then(()=>{
    for(const close of cleanup){
        close();
    }
}).catch(err=>{
    console.error(err);
    process.exitCode=1;
});
