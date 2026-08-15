class Fake{
    //fake class as fallback
}

class FakeCore{
    //fake class as fallback
}

const brandProbe={};

const tryBrand=function(check){
    try{
        check();
        return true;
    }catch(err){
        return false;
    }
};

const methodBrand=function(value,prototype,method,args=[]){
    if(!prototype || typeof prototype[method] !== 'function'){
        return false;
    }

    return tryBrand(()=>Reflect.apply(prototype[method],value,args));
};

const getterBrand=function(value,prototype,property){
    if(!prototype){
        return false;
    }

    const descriptor=Object.getOwnPropertyDescriptor(prototype,property);
    if(!descriptor || typeof descriptor.get !== 'function'){
        return false;
    }

    return tryBrand(()=>Reflect.apply(descriptor.get,value,[]));
};

const getterValue=function(value,prototype,property){
    const descriptor=prototype && Object.getOwnPropertyDescriptor(prototype,property);
    if(!descriptor || typeof descriptor.get !== 'function'){
        return undefined;
    }

    return Reflect.apply(descriptor.get,value,[]);
};

const instanceOf=function(value,constructor){
    if(typeof constructor !== 'function'){
        return false;
    }

    try{
        return value instanceof constructor;
    }catch(err){
        return false;
    }
};

const stringTagCheck=function(value,type){
    try{
        return Object.prototype.toString.call(value) === `[object ${type}]`;
    }catch(err){
        return false;
    }
};

const arrayBufferCheck=function(value){
    return getterBrand(value,globalThis.ArrayBuffer && globalThis.ArrayBuffer.prototype,'byteLength');
};

const sharedArrayBufferCheck=function(value){
    const constructor=globalThis.SharedArrayBuffer;
    return getterBrand(value,constructor && constructor.prototype,'byteLength');
};

const dataViewCheck=function(value){
    return getterBrand(value,globalThis.DataView && globalThis.DataView.prototype,'byteLength');
};

const arrayBufferViewCheck=function(value){
    try{
        return ArrayBuffer.isView(value);
    }catch(err){
        return false;
    }
};

const typedArrayTagGetter=(function(){
    const prototype=Object.getPrototypeOf(Uint8Array.prototype);
    const descriptor=Object.getOwnPropertyDescriptor(prototype,Symbol.toStringTag);
    return descriptor && descriptor.get;
})();

const typedArrayName=function(value){
    if(!arrayBufferViewCheck(value) || dataViewCheck(value) || typeof typedArrayTagGetter !== 'function'){
        return false;
    }

    try{
        return Reflect.apply(typedArrayTagGetter,value,[]);
    }catch(err){
        return false;
    }
};

const dateCheck=function(value){
    return methodBrand(value,Date.prototype,'getTime');
};

const validDateCheck=function(value){
    if(!dateCheck(value)){
        return false;
    }

    return !Number.isNaN(Reflect.apply(Date.prototype.getTime,value,[]));
};

const mapCheck=function(value){
    return methodBrand(value,Map.prototype,'has',[brandProbe]);
};

const weakMapCheck=function(value){
    return methodBrand(value,WeakMap.prototype,'has',[brandProbe]);
};

const setCheck=function(value){
    return methodBrand(value,Set.prototype,'has',[brandProbe]);
};

const weakSetCheck=function(value){
    return methodBrand(value,WeakSet.prototype,'has',[brandProbe]);
};

const regExpCheck=function(value){
    return getterBrand(value,RegExp.prototype,'source');
};

const boxedBooleanCheck=function(value){
    return typeof value === 'object' && value !== null && methodBrand(value,Boolean.prototype,'valueOf');
};

const boxedNumberCheck=function(value){
    return typeof value === 'object' && value !== null && methodBrand(value,Number.prototype,'valueOf');
};

const boxedBigIntCheck=function(value){
    const prototype=globalThis.BigInt && globalThis.BigInt.prototype;
    return typeof value === 'object' && value !== null && methodBrand(value,prototype,'valueOf');
};

const boxedStringCheck=function(value){
    return typeof value === 'object' && value !== null && methodBrand(value,String.prototype,'valueOf');
};

const boxedSymbolCheck=function(value){
    const prototype=globalThis.Symbol && globalThis.Symbol.prototype;
    return typeof value === 'object' && value !== null && methodBrand(value,prototype,'valueOf');
};

const plainObjectCheck=function(value){
    if(value === null || typeof value !== 'object'){
        return false;
    }

    let prototype;
    try{
        prototype=Object.getPrototypeOf(value);
    }catch(err){
        return false;
    }
    if(prototype === null){
        return true;
    }

    if(!Object.prototype.hasOwnProperty.call(prototype,'constructor')){
        return false;
    }

    const constructor=prototype.constructor;
    return typeof constructor === 'function' && Function.prototype.toString.call(constructor) === Function.prototype.toString.call(Object);
};

const protocolCheck=function(value,symbol,method){
    if(value === null || value === undefined){
        return false;
    }

    const key=typeof symbol === 'symbol' ? symbol : method;
    if(typeof key !== 'symbol' && typeof key !== 'string'){
        return false;
    }

    try{
        return typeof value[key] === 'function';
    }catch(err){
        return false;
    }
};

const blockedUnionMethods=new Set([
    'constructor',
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

const validatorFor=function(target,name){
    if(blockedUnionMethods.has(name)){
        return false;
    }

    let current=target;
    while(current && current !== Object.prototype){
        const descriptor=Object.getOwnPropertyDescriptor(current,name);
        if(descriptor && typeof descriptor.value === 'function' && descriptor.value.length <= 1){
            return descriptor.value;
        }
        current=Object.getPrototypeOf(current);
    }

    return false;
};

class Is{
    constructor(strict=true){
        this.strict=strict;
    }

    //core
    throw(valueType,expectedType){
        const err=new TypeError;
        err.message=`expected type of ${valueType} to be ${expectedType}`;
        if(!this.strict){
            return false;
        }
        throw err;
    }

    check(value,pass,expectedType){
        if(pass){
            return true;
        }

        const valueType=value === null ? 'null' : typeof value;
        return this.throw(valueType,expectedType);
    }

    typeCheck(value,type){
        return this.check(value,typeof value === type,type);
    }

    instanceCheck(value=new Fake,constructor=FakeCore){
        return this.check(value,instanceOf(value,constructor),constructor && constructor.name ? constructor.name : 'available constructor');
    }

    symbolStringCheck(value,type){
        return this.check(value,stringTagCheck(value,type),`[object ${type}]`);
    }

    compare(value,targetValue,typeName=String(targetValue)){
        return this.check(value,Object.is(value,targetValue),typeName);
    }

    globalInstanceCheck(value,type){
        return this.check(value,instanceOf(value,globalThis[type]),type);
    }

    nestedInstanceCheck(value,container,type){
        const constructor=container && container[type];
        return this.check(value,instanceOf(value,constructor),type);
    }

    globalValueCheck(value,type){
        const available=Object.prototype.hasOwnProperty.call(globalThis,type);
        return this.check(value,available && Object.is(value,globalThis[type]),type);
    }

    nestedValueCheck(value,container,type){
        const available=container && Object.prototype.hasOwnProperty.call(container,type);
        return this.check(value,available && Object.is(value,container[type]),type);
    }

    defined(value){
        return this.check(value,value !== undefined,'defined');
    }

    any(value){
        return this.defined(value);
    }

    exists(value){
        return this.defined(value);
    }

    union(value,typesString){
        const types=Array.isArray(typesString) ? typesString : typeof typesString === 'string' ? typesString.split('|') : [];
        const names=types.map(type=>typeof type === 'string' ? type.trim() : '').filter(Boolean);
        if(!names.length){
            return this.throw(typeof typesString,'a pipe-delimited string or array of strong-type methods');
        }

        const validators=names.map(name=>validatorFor(this,name));
        if(validators.some(validator=>!validator)){
            const invalid=names[validators.findIndex(validator=>!validator)];
            return this.throw(invalid,'a method available on strong-type');
        }

        const weakIs=Object.create(this);
        weakIs.strict=false;
        for(let index=0;index<validators.length;index++){
            try{
                if(validators[index].call(weakIs,value)){
                    return true;
                }
            }catch(err){
                //custom validators may throw even when strict is false
            }
        }

        return this.throw(typeof value,names.join('|'));
    }

    //values and primitives
    finite(value){
        return this.check(value,Number.isFinite(value),'finite number');
    }

    finiteNumber(value){
        return this.finite(value);
    }

    NaN(value){
        return this.check(value,Number.isNaN(value),'NaN');
    }

    nan(value){
        return this.NaN(value);
    }

    null(value){
        return this.check(value,value === null,'null');
    }

    nullish(value){
        return this.check(value,value === null || value === undefined,'null or undefined');
    }

    boolean(value){
        return this.typeCheck(value,'boolean');
    }

    bigInt(value){
        return this.typeCheck(value,'bigint');
    }

    bigint(value){
        return this.bigInt(value);
    }

    number(value){
        return this.typeCheck(value,'number');
    }

    integer(value){
        return this.check(value,Number.isInteger(value),'integer');
    }

    safeInteger(value){
        return this.check(value,Number.isSafeInteger(value),'safe integer');
    }

    infinity(value){
        return this.check(value,value === Infinity,'Infinity');
    }

    infinite(value){
        return this.check(value,value === Infinity || value === -Infinity,'positive or negative Infinity');
    }

    positiveInfinity(value){
        return this.infinity(value);
    }

    negativeInfinity(value){
        return this.check(value,value === -Infinity,'-Infinity');
    }

    negativeZero(value){
        return this.check(value,Object.is(value,-0),'-0');
    }

    string(value){
        return this.typeCheck(value,'string');
    }

    symbol(value){
        return this.typeCheck(value,'symbol');
    }

    undefined(value){
        return this.typeCheck(value,'undefined');
    }

    primitive(value){
        const type=typeof value;
        return this.check(value,value === null || (type !== 'object' && type !== 'function'),'primitive');
    }

    globalThis(value){
        return this.compare(value,globalThis,'explicitly globalThis, not window, global nor self');
    }

    atomics(value){
        return this.globalValueCheck(value,'Atomics');
    }

    json(value){
        return this.globalValueCheck(value,'JSON');
    }

    math(value){
        return this.globalValueCheck(value,'Math');
    }

    reflect(value){
        return this.globalValueCheck(value,'Reflect');
    }

    rawJSON(value){
        const check=globalThis.JSON && globalThis.JSON.isRawJSON;
        let pass=false;
        try{
            pass=typeof check === 'function' && check(value);
        }catch(err){
            pass=false;
        }
        return this.check(value,pass,'raw JSON');
    }

    //objects and collections
    array(value){
        return this.check(value,tryBrand(()=>{
            if(!Array.isArray(value)){
                throw new TypeError;
            }
        }),'Array');
    }

    date(value){
        return this.check(value,dateCheck(value),'Date');
    }

    validDate(value){
        return this.check(value,validDateCheck(value),'valid Date');
    }

    map(value){
        return this.check(value,mapCheck(value),'Map');
    }

    weakMap(value){
        return this.check(value,weakMapCheck(value),'WeakMap');
    }

    object(value){
        return this.typeCheck(value,'object');
    }

    nonNullObject(value){
        return this.check(value,value !== null && typeof value === 'object','non-null object');
    }

    plainObject(value){
        return this.check(value,plainObjectCheck(value),'plain object');
    }

    nullPrototypeObject(value){
        const pass=value !== null && typeof value === 'object' && tryBrand(()=>{
            if(Object.getPrototypeOf(value) !== null){
                throw new TypeError;
            }
        });
        return this.check(value,pass,'null-prototype object');
    }

    argumentsObject(value){
        return this.symbolStringCheck(value,'Arguments');
    }

    promise(value){
        return this.globalInstanceCheck(value,'Promise');
    }

    thenable(value){
        const pass=value !== null && value !== undefined && (typeof value === 'object' || typeof value === 'function') && protocolCheck(value,false,'then');
        return this.check(value,pass,'thenable');
    }

    regExp(value){
        return this.check(value,regExpCheck(value),'RegExp');
    }

    regexp(value){
        return this.regExp(value);
    }

    set(value){
        return this.check(value,setCheck(value),'Set');
    }

    weakSet(value){
        return this.check(value,weakSetCheck(value),'WeakSet');
    }

    //boxed primitives
    boxedPrimitive(value){
        const pass=boxedBooleanCheck(value) || boxedNumberCheck(value) || boxedBigIntCheck(value) || boxedStringCheck(value) || boxedSymbolCheck(value);
        return this.check(value,pass,'boxed primitive');
    }

    booleanObject(value){
        return this.check(value,boxedBooleanCheck(value),'Boolean object');
    }

    numberObject(value){
        return this.check(value,boxedNumberCheck(value),'Number object');
    }

    bigIntObject(value){
        return this.check(value,boxedBigIntCheck(value),'BigInt object');
    }

    stringObject(value){
        return this.check(value,boxedStringCheck(value),'String object');
    }

    symbolObject(value){
        return this.check(value,boxedSymbolCheck(value),'Symbol object');
    }

    //functions and protocols
    function(value){
        return this.typeCheck(value,'function');
    }

    callable(value){
        return this.function(value);
    }

    asyncFunction(value){
        return this.symbolStringCheck(value,'AsyncFunction');
    }

    generatorFunction(value){
        return this.symbolStringCheck(value,'GeneratorFunction');
    }

    asyncGeneratorFunction(value){
        return this.symbolStringCheck(value,'AsyncGeneratorFunction');
    }

    generator(value){
        return this.symbolStringCheck(value,'Generator');
    }

    asyncGenerator(value){
        return this.symbolStringCheck(value,'AsyncGenerator');
    }

    iterator(value){
        const pass=value !== null && value !== undefined && protocolCheck(value,false,'next');
        return this.check(value,pass,'iterator');
    }

    asyncIterator(value){
        const symbol=Symbol.asyncIterator;
        const pass=value !== null && value !== undefined && protocolCheck(value,false,'next') && typeof symbol === 'symbol' && protocolCheck(value,symbol);
        return this.check(value,pass,'async iterator');
    }

    iterable(value){
        return this.check(value,protocolCheck(value,Symbol.iterator),'iterable');
    }

    asyncIterable(value){
        return this.check(value,protocolCheck(value,Symbol.asyncIterator),'async iterable');
    }

    //errors
    error(value){
        return this.instanceCheck(value,Error);
    }

    aggregateError(value){
        return this.globalInstanceCheck(value,'AggregateError');
    }

    evalError(value){
        return this.instanceCheck(value,EvalError);
    }

    rangeError(value){
        return this.instanceCheck(value,RangeError);
    }

    referenceError(value){
        return this.instanceCheck(value,ReferenceError);
    }

    syntaxError(value){
        return this.instanceCheck(value,SyntaxError);
    }

    typeError(value){
        return this.instanceCheck(value,TypeError);
    }

    URIError(value){
        return this.instanceCheck(value,URIError);
    }

    uriError(value){
        return this.URIError(value);
    }

    suppressedError(value){
        return this.globalInstanceCheck(value,'SuppressedError');
    }

    //typed arrays
    typedArray(value){
        return this.check(value,Boolean(typedArrayName(value)),'typed array');
    }

    arrayBufferView(value){
        return this.check(value,arrayBufferViewCheck(value),'ArrayBuffer view');
    }

    bigInt64Array(value){
        return this.check(value,typedArrayName(value) === 'BigInt64Array','BigInt64Array');
    }

    bigUint64Array(value){
        return this.check(value,typedArrayName(value) === 'BigUint64Array','BigUint64Array');
    }

    float16Array(value){
        return this.check(value,typedArrayName(value) === 'Float16Array','Float16Array');
    }

    float32Array(value){
        return this.check(value,typedArrayName(value) === 'Float32Array','Float32Array');
    }

    float64Array(value){
        return this.check(value,typedArrayName(value) === 'Float64Array','Float64Array');
    }

    int8Array(value){
        return this.check(value,typedArrayName(value) === 'Int8Array','Int8Array');
    }

    int16Array(value){
        return this.check(value,typedArrayName(value) === 'Int16Array','Int16Array');
    }

    int32Array(value){
        return this.check(value,typedArrayName(value) === 'Int32Array','Int32Array');
    }

    uint8Array(value){
        return this.check(value,typedArrayName(value) === 'Uint8Array','Uint8Array');
    }

    uint8ClampedArray(value){
        return this.check(value,typedArrayName(value) === 'Uint8ClampedArray','Uint8ClampedArray');
    }

    uint16Array(value){
        return this.check(value,typedArrayName(value) === 'Uint16Array','Uint16Array');
    }

    uint32Array(value){
        return this.check(value,typedArrayName(value) === 'Uint32Array','Uint32Array');
    }

    //buffers
    arrayBuffer(value){
        return this.check(value,arrayBufferCheck(value),'ArrayBuffer');
    }

    sharedArrayBuffer(value){
        return this.check(value,sharedArrayBufferCheck(value),'SharedArrayBuffer');
    }

    anyArrayBuffer(value){
        return this.check(value,arrayBufferCheck(value) || sharedArrayBufferCheck(value),'ArrayBuffer or SharedArrayBuffer');
    }

    dataView(value){
        return this.check(value,dataViewCheck(value),'DataView');
    }

    resizableArrayBuffer(value){
        const prototype=globalThis.ArrayBuffer && globalThis.ArrayBuffer.prototype;
        const pass=arrayBufferCheck(value) && getterBrand(value,prototype,'resizable') && getterValue(value,prototype,'resizable') === true;
        return this.check(value,pass,'resizable ArrayBuffer');
    }

    growableSharedArrayBuffer(value){
        const constructor=globalThis.SharedArrayBuffer;
        const prototype=constructor && constructor.prototype;
        const pass=sharedArrayBufferCheck(value) && getterBrand(value,prototype,'growable') && getterValue(value,prototype,'growable') === true;
        return this.check(value,pass,'growable SharedArrayBuffer');
    }

    detachedArrayBuffer(value){
        if(!arrayBufferCheck(value)){
            return this.check(value,false,'detached ArrayBuffer');
        }

        const prototype=globalThis.ArrayBuffer.prototype;
        const descriptor=Object.getOwnPropertyDescriptor(prototype,'detached');
        if(descriptor && typeof descriptor.get === 'function'){
            return this.check(value,Reflect.apply(descriptor.get,value,[]) === true,'detached ArrayBuffer');
        }

        let detached=false;
        try{
            new DataView(value);
        }catch(err){
            detached=true;
        }
        return this.check(value,detached,'detached ArrayBuffer');
    }

    //Intl
    intlDateTimeFormat(value){
        const constructor=globalThis.Intl && globalThis.Intl.DateTimeFormat;
        const pass=constructor && methodBrand(value,constructor.prototype,'resolvedOptions');
        return this.check(value,pass,'Intl.DateTimeFormat');
    }

    intlCollator(value){
        const constructor=globalThis.Intl && globalThis.Intl.Collator;
        const pass=constructor && methodBrand(value,constructor.prototype,'resolvedOptions');
        return this.check(value,pass,'Intl.Collator');
    }

    intlDisplayNames(value){
        const constructor=globalThis.Intl && globalThis.Intl.DisplayNames;
        const pass=constructor && methodBrand(value,constructor.prototype,'resolvedOptions');
        return this.check(value,pass,'Intl.DisplayNames');
    }

    intlListFormat(value){
        const constructor=globalThis.Intl && globalThis.Intl.ListFormat;
        const pass=constructor && methodBrand(value,constructor.prototype,'resolvedOptions');
        return this.check(value,pass,'Intl.ListFormat');
    }

    intlLocale(value){
        const constructor=globalThis.Intl && globalThis.Intl.Locale;
        const pass=constructor && getterBrand(value,constructor.prototype,'baseName');
        return this.check(value,pass,'Intl.Locale');
    }

    intlNumberFormat(value){
        const constructor=globalThis.Intl && globalThis.Intl.NumberFormat;
        const pass=constructor && methodBrand(value,constructor.prototype,'resolvedOptions');
        return this.check(value,pass,'Intl.NumberFormat');
    }

    intlPluralRules(value){
        const constructor=globalThis.Intl && globalThis.Intl.PluralRules;
        const pass=constructor && methodBrand(value,constructor.prototype,'resolvedOptions');
        return this.check(value,pass,'Intl.PluralRules');
    }

    intlRelativeTimeFormat(value){
        const constructor=globalThis.Intl && globalThis.Intl.RelativeTimeFormat;
        const pass=constructor && methodBrand(value,constructor.prototype,'resolvedOptions');
        return this.check(value,pass,'Intl.RelativeTimeFormat');
    }

    intlSegmenter(value){
        const constructor=globalThis.Intl && globalThis.Intl.Segmenter;
        const pass=constructor && methodBrand(value,constructor.prototype,'resolvedOptions');
        return this.check(value,pass,'Intl.Segmenter');
    }

    intlSegments(value){
        const constructor=globalThis.Intl && globalThis.Intl.Segmenter;
        let pass=false;
        if(constructor){
            const prototype=Object.getPrototypeOf(new constructor().segment(''));
            pass=methodBrand(value,prototype,'containing',[0]);
        }
        return this.check(value,pass,'Intl Segments');
    }

    intlDurationFormat(value){
        const constructor=globalThis.Intl && globalThis.Intl.DurationFormat;
        const pass=constructor && methodBrand(value,constructor.prototype,'resolvedOptions');
        return this.check(value,pass,'Intl.DurationFormat');
    }

    //garbage collection and resource management
    finalizationRegistry(value){
        const constructor=globalThis.FinalizationRegistry;
        const pass=constructor && methodBrand(value,constructor.prototype,'unregister',[brandProbe]);
        return this.check(value,pass,'FinalizationRegistry');
    }

    weakRef(value){
        const constructor=globalThis.WeakRef;
        const pass=constructor && methodBrand(value,constructor.prototype,'deref');
        return this.check(value,pass,'WeakRef');
    }

    disposable(value){
        const symbol=Symbol.dispose;
        return this.check(value,typeof symbol === 'symbol' && protocolCheck(value,symbol),'disposable');
    }

    asyncDisposable(value){
        const symbol=Symbol.asyncDispose;
        return this.check(value,typeof symbol === 'symbol' && protocolCheck(value,symbol),'async disposable');
    }

    disposableStack(value){
        return this.globalInstanceCheck(value,'DisposableStack');
    }

    asyncDisposableStack(value){
        return this.globalInstanceCheck(value,'AsyncDisposableStack');
    }

    //Temporal
    temporalDuration(value){
        return this.nestedInstanceCheck(value,globalThis.Temporal,'Duration');
    }

    temporalInstant(value){
        return this.nestedInstanceCheck(value,globalThis.Temporal,'Instant');
    }

    temporalPlainDate(value){
        return this.nestedInstanceCheck(value,globalThis.Temporal,'PlainDate');
    }

    temporalPlainDateTime(value){
        return this.nestedInstanceCheck(value,globalThis.Temporal,'PlainDateTime');
    }

    temporalPlainMonthDay(value){
        return this.nestedInstanceCheck(value,globalThis.Temporal,'PlainMonthDay');
    }

    temporalPlainTime(value){
        return this.nestedInstanceCheck(value,globalThis.Temporal,'PlainTime');
    }

    temporalPlainYearMonth(value){
        return this.nestedInstanceCheck(value,globalThis.Temporal,'PlainYearMonth');
    }

    temporalZonedDateTime(value){
        return this.nestedInstanceCheck(value,globalThis.Temporal,'ZonedDateTime');
    }

    //URL and text
    url(value){
        return this.globalInstanceCheck(value,'URL');
    }

    urlSearchParams(value){
        return this.globalInstanceCheck(value,'URLSearchParams');
    }

    urlPattern(value){
        return this.globalInstanceCheck(value,'URLPattern');
    }

    textEncoder(value){
        return this.globalInstanceCheck(value,'TextEncoder');
    }

    textDecoder(value){
        return this.globalInstanceCheck(value,'TextDecoder');
    }

    textEncoderStream(value){
        return this.globalInstanceCheck(value,'TextEncoderStream');
    }

    textDecoderStream(value){
        return this.globalInstanceCheck(value,'TextDecoderStream');
    }

    //fetch and data
    domException(value){
        return this.globalInstanceCheck(value,'DOMException');
    }

    blob(value){
        return this.globalInstanceCheck(value,'Blob');
    }

    file(value){
        return this.globalInstanceCheck(value,'File');
    }

    formData(value){
        return this.globalInstanceCheck(value,'FormData');
    }

    headers(value){
        return this.globalInstanceCheck(value,'Headers');
    }

    request(value){
        return this.globalInstanceCheck(value,'Request');
    }

    response(value){
        return this.globalInstanceCheck(value,'Response');
    }

    //events and messaging
    abortController(value){
        return this.globalInstanceCheck(value,'AbortController');
    }

    abortSignal(value){
        return this.globalInstanceCheck(value,'AbortSignal');
    }

    event(value){
        return this.globalInstanceCheck(value,'Event');
    }

    eventTarget(value){
        return this.globalInstanceCheck(value,'EventTarget');
    }

    customEvent(value){
        return this.globalInstanceCheck(value,'CustomEvent');
    }

    messageEvent(value){
        return this.globalInstanceCheck(value,'MessageEvent');
    }

    closeEvent(value){
        return this.globalInstanceCheck(value,'CloseEvent');
    }

    errorEvent(value){
        return this.globalInstanceCheck(value,'ErrorEvent');
    }

    broadcastChannel(value){
        return this.globalInstanceCheck(value,'BroadcastChannel');
    }

    messageChannel(value){
        return this.globalInstanceCheck(value,'MessageChannel');
    }

    messagePort(value){
        return this.globalInstanceCheck(value,'MessagePort');
    }

    webSocket(value){
        return this.globalInstanceCheck(value,'WebSocket');
    }

    eventSource(value){
        return this.globalInstanceCheck(value,'EventSource');
    }

    navigator(value){
        return this.globalValueCheck(value,'navigator');
    }

    storage(value){
        return this.globalInstanceCheck(value,'Storage');
    }

    //streams
    readableStream(value){
        return this.globalInstanceCheck(value,'ReadableStream');
    }

    readableStreamDefaultReader(value){
        return this.globalInstanceCheck(value,'ReadableStreamDefaultReader');
    }

    readableStreamBYOBReader(value){
        return this.globalInstanceCheck(value,'ReadableStreamBYOBReader');
    }

    readableStreamDefaultController(value){
        return this.globalInstanceCheck(value,'ReadableStreamDefaultController');
    }

    readableByteStreamController(value){
        return this.globalInstanceCheck(value,'ReadableByteStreamController');
    }

    readableStreamBYOBRequest(value){
        return this.globalInstanceCheck(value,'ReadableStreamBYOBRequest');
    }

    writableStream(value){
        return this.globalInstanceCheck(value,'WritableStream');
    }

    writableStreamDefaultWriter(value){
        return this.globalInstanceCheck(value,'WritableStreamDefaultWriter');
    }

    writableStreamDefaultController(value){
        return this.globalInstanceCheck(value,'WritableStreamDefaultController');
    }

    transformStream(value){
        return this.globalInstanceCheck(value,'TransformStream');
    }

    transformStreamDefaultController(value){
        return this.globalInstanceCheck(value,'TransformStreamDefaultController');
    }

    byteLengthQueuingStrategy(value){
        return this.globalInstanceCheck(value,'ByteLengthQueuingStrategy');
    }

    countQueuingStrategy(value){
        return this.globalInstanceCheck(value,'CountQueuingStrategy');
    }

    compressionStream(value){
        return this.globalInstanceCheck(value,'CompressionStream');
    }

    decompressionStream(value){
        return this.globalInstanceCheck(value,'DecompressionStream');
    }

    //crypto and performance
    crypto(value){
        return this.globalValueCheck(value,'crypto');
    }

    subtleCrypto(value){
        const crypto=globalThis.crypto;
        return this.check(value,crypto && Object.is(value,crypto.subtle),'SubtleCrypto');
    }

    cryptoKey(value){
        return this.globalInstanceCheck(value,'CryptoKey');
    }

    performance(value){
        return this.globalValueCheck(value,'performance');
    }

    performanceEntry(value){
        return this.globalInstanceCheck(value,'PerformanceEntry');
    }

    performanceMark(value){
        return this.globalInstanceCheck(value,'PerformanceMark');
    }

    performanceMeasure(value){
        return this.globalInstanceCheck(value,'PerformanceMeasure');
    }

    performanceObserver(value){
        return this.globalInstanceCheck(value,'PerformanceObserver');
    }

    performanceObserverEntryList(value){
        return this.globalInstanceCheck(value,'PerformanceObserverEntryList');
    }

    performanceResourceTiming(value){
        return this.globalInstanceCheck(value,'PerformanceResourceTiming');
    }

    //WebAssembly
    webAssemblyModule(value){
        return this.nestedInstanceCheck(value,globalThis.WebAssembly,'Module');
    }

    webAssemblyInstance(value){
        return this.nestedInstanceCheck(value,globalThis.WebAssembly,'Instance');
    }

    webAssemblyMemory(value){
        return this.nestedInstanceCheck(value,globalThis.WebAssembly,'Memory');
    }

    webAssemblyTable(value){
        return this.nestedInstanceCheck(value,globalThis.WebAssembly,'Table');
    }

    webAssemblyGlobal(value){
        return this.nestedInstanceCheck(value,globalThis.WebAssembly,'Global');
    }

    webAssemblyTag(value){
        return this.nestedInstanceCheck(value,globalThis.WebAssembly,'Tag');
    }

    webAssemblyException(value){
        return this.nestedInstanceCheck(value,globalThis.WebAssembly,'Exception');
    }

    webAssemblyCompileError(value){
        return this.nestedInstanceCheck(value,globalThis.WebAssembly,'CompileError');
    }

    webAssemblyLinkError(value){
        return this.nestedInstanceCheck(value,globalThis.WebAssembly,'LinkError');
    }

    webAssemblyRuntimeError(value){
        return this.nestedInstanceCheck(value,globalThis.WebAssembly,'RuntimeError');
    }
}

export {Is as default,Is};
