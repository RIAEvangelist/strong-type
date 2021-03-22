import VanillaTest from 'vanilla-test';
import Is from '../index.js'
const test=new VanillaTest;
const is=new Is;
const cleanup=function(){
    test.pass();
    test.done();
}

const fail=function(e){
    console.trace(e)
    test.fail();
}

const basic=function(key,value){
    test.expects(`is.${key}(${value});`);
    is[key](value);
}

//basic test template

// try{
//     basic('',);    
// }catch(e){
//     fail(e);
// }
// cleanup();

//hand writtenbasic test template
//used to log out human readable test

// try{
//    test.expects(``);
//    is.();   
// }catch(e){
//     fail(e);
// }
// cleanup();

try{
    basic('globalThis',global);    
}catch(e){
    fail(e);
}
cleanup();

try{
    test.expects(`is.array([]);`);
    is.array([]);
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('bigInt',1n);    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('boolean',false);    
}catch(e){
    fail(e);
}
cleanup();

try{
   test.expects(`is.date(new Date);`);
   is.date(new Date);   
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('finite',1);   
}catch(e){
    fail(e);
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
}catch(e){
    fail(e);
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
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('infinity',Infinity);    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('map',new Map);
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('NaN',NaN);
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('number',1);    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('object',{});    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('promise',(async ()=>{})());    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('regExp',/test/ig);    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('set',new Set);    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('string','test');    
}catch(e){
    fail(e);
}
cleanup();

try{
    test.expects(`is.symbol(Symbol());`);
    is.symbol(Symbol());
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('undefined');    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('weakMap',new WeakMap());    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('weakSet',new WeakSet());    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('function',()=>{});    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('asyncFunction', async ()=>{});    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('generatorFunction',function*(){});    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('asyncGeneratorFunction',async function*(){});    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('error',new Error);    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('evalError',new EvalError);    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('rangeError',new RangeError);    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('referenceError',new ReferenceError);    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('syntaxError',new SyntaxError);    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('typeError',new TypeError);    
}catch(e){
    fail(e);
}
cleanup();

try{
    basic('URIError',new URIError);    
}catch(e){
    fail(e);
}
cleanup();

// try{
//     basic('',);    
// }catch(e){
//     fail(e);
// }
// cleanup();

// try{
//     basic('',);    
// }catch(e){
//     fail(e);
// }
// cleanup();

// try{
//     basic('',);    
// }catch(e){
//     fail(e);
// }
// cleanup();




test.report();