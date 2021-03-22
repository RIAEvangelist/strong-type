import VanillaTest from 'vanilla-test';
import Is from '../index.js'
const test=new VanillaTest;
const is=new Is;
const cleanup=function(){
    test.pass();
    test.done();
}

const fail=function(err){
    console.trace(err)
    test.fail();
}

const basic=function(key,value){
    test.expects(`is.${key}(${value});`);
    is[key](value);
}

//basic test template

// try{
//     basic('',);    
// }catch(err){
//     fail(err);
// }
// cleanup();

//hand writtenbasic test template
//used to log out human readable test

// try{
//    test.expects(``);
//    is.();   
// }catch(err){
//     fail(err);
// }
// cleanup();

try{
    basic('globalThis',global);    
}catch(err){
    fail(err);
}
cleanup();

try{
    test.expects(`is.array([]);`);
    is.array([]);
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('bigInt',1n);    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('boolean',false);    
}catch(err){
    fail(err);
}
cleanup();

try{
   test.expects(`is.date(new Date);`);
   is.date(new Date);   
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('finite',1);   
}catch(err){
    fail(err);
}
cleanup();

try{
    test.expects(`
        const generatorFunction=function*(){};
        const generator=generatorFunction();
        is.generator(generator);
    `);
    
    const generatorFunction=function*(){};
    const generator=generatorFunction();
    is.generator(generator);  
}catch(err){
    fail(err);
}
cleanup();

try{
    test.expects(`
        const asyncGeneratorFunction=async function*(){};
        const asyncGenerator=asyncGeneratorFunction();
        is.generator(generator);
    `);
    
    const asyncGeneratorFunction=async function*(){};
    const asyncGenerator=asyncGeneratorFunction();
    is.asyncGenerator(asyncGenerator);  
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('infinity',Infinity);    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('map',new Map);
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('NaN',NaN);
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('number',1);    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('object',{});    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('promise',(async ()=>{})());    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('regExp',/test/ig);    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('set',new Set);    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('string','test');    
}catch(err){
    fail(err);
}
cleanup();

try{
    test.expects(`is.symbol(Symbol());`);
    is.symbol(Symbol());
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('undefined');    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('weakMap',new WeakMap());    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('weakSet',new WeakSet());    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('function',()=>{});    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('asyncFunction', async ()=>{});    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('generatorFunction',function*(){});    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('asyncGeneratorFunction',async function*(){});    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('error',new Error);    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('evalError',new EvalError);    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('rangeError',new RangeError);    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('referenceError',new ReferenceError);    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('syntaxError',new SyntaxError);    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('typeError',new TypeError);    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('URIError',new URIError);    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('dataView',new DataView(new ArrayBuffer));    
}catch(err){
    fail(err);
}
cleanup();

try{
    basic('sharedArrayBuffer',new SharedArrayBuffer);    
}catch(err){
    fail(err);
}
cleanup();

try{
    test.expects(`is.bigInt64Array(new BigInt64Array);`);
    is.bigInt64Array(new BigInt64Array);
}catch(err){
    fail(err);
}
cleanup();

try{
    test.expects(`is.bigUint64Array(new BigUint64Array);`);
    is.bigUint64Array(new BigUint64Array);
}catch(err){
    fail(err);
}
cleanup();

try{
    test.expects(`is.float32Array(new Float32Array);`);
    is.float32Array(new Float32Array);
}catch(err){
    fail(err);
}
cleanup();

try{
    test.expects(`is.float64Array(new Float64Array);`);
    is.float64Array(new Float64Array);
}catch(err){
    fail(err);
}
cleanup();

try{
    test.expects(`is.int8Array(new Int8Array);`);
    is.int8Array(new Int8Array);
}catch(err){
    fail(err);
}
cleanup();

try{
    test.expects(`is.int16Array(new Int16Array);`);
    is.int16Array(new Int16Array);
}catch(err){
    fail(err);
}
cleanup();

try{
    test.expects(`is.int32Array(new Int32Array);`);
    is.int32Array(new Int32Array);
}catch(err){
    fail(err);
}
cleanup();

try{
    test.expects(`is.uint8Array(new Uint8Array);`);
    is.uint8Array(new Uint8Array);
}catch(err){
    fail(err);
}
cleanup();

try{
    test.expects(`is.uint8ClampedArray(new Uint8ClampedArray);`);
    is.uint8ClampedArray(new Uint8ClampedArray);
}catch(err){
    fail(err);
}
cleanup();

try{
    test.expects(`is.uint16Array(new Uint16Array);`);
    is.uint16Array(new Uint16Array);
}catch(err){
    fail(err);
}
cleanup();

try{
    test.expects(`is.uint32Array(new Uint32Array);`);
    is.uint32Array(new Uint32Array);
}catch(err){
    fail(err);
}
cleanup();


test.report();

// try{
//     basic('',);    
// }catch(err){
//     fail(err);
// }
// cleanup();

//hand writtenbasic test template
//used to log out human readable test

// try{
//    test.expects(``);
//    is.();   
// }catch(err){
//     fail(err);
// }
// cleanup();