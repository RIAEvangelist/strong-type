import Is from './index.js';

const is=new Is(false);

class Fake{
    //fake class as fallback
}

const types={
    //unique checks
    finite:{
        constructor:undefined,
        supported:undefined,
        value:99  
    },
    NaN:{
        constructor:undefined,
        supported:undefined,
        value:undefined  
    },
    //common sugar
    array:{
        constructor:Array,
        supported:undefined,
        value:[]  
    },
    boolean:{
        constructor:undefined,
        supported:undefined,
        value:true  
    },
    bigint:{
        constructor:undefined,
        supported:undefined,
        value:99n  
    },
    date:{
        constructor:Date,
        supported:undefined,
        value:undefined  
    },
    generator:{
        constructor:undefined,
        supported:undefined,
        value:(function*(){})()  
    },
    asyncGenerator:{
        constructor:undefined,
        supported:undefined,
        value:(async function*(){})()
    },
    globalThis:{
        constructor:undefined,
        supported:undefined,
        value:globalThis  
    },
    infinity:{
        constructor:undefined,
        supported:undefined,
        value:Infinity  
    },
    map:{
        constructor:Map,
        supported:undefined,
        value:undefined  
    },
    weakMap:{
        constructor:WeakMap,
        supported:undefined,
        value:undefined  
    },
    number:{
        constructor:undefined,
        supported:undefined,
        value:5  
    },
    object:{
        constructor:undefined,
        supported:undefined,
        value:{}  
    },
    promise:{
        constructor:Promise,
        supported:undefined,
        value:undefined,
        constructorArgs:[function promiseArg(){}]
    },
    regExp:{
        constructor:RegExp,
        supported:undefined,
        value:undefined  
    },
    undefined:{
        constructor:undefined,
        supported:undefined,
        value:undefined  
    },
    set:{
        constructor:Set,
        supported:undefined,
        value:undefined  
    },
    weakSet:{
        constructor:WeakSet,
        supported:undefined,
        value:undefined  
    },
    string:{
        constructor:undefined,
        supported:undefined,
        value:'string',
    },
    symbol:{
        constructor:undefined,
        supported:undefined,
        value:Symbol('test'),
    },
    //functions
    function:{
        constructor:undefined,
        supported:undefined,
        value:function(){},
    },
    asyncFunction:{
        constructor:undefined,
        supported:undefined,
        value:async function(){},
    },
    generatorFunction:{
        constructor:undefined,
        supported:undefined,
        value:function*(){},
    },
    asyncGeneratorFunction:{
        constructor:undefined,
        supported:undefined,
        value:async function*(){},
    },
    //error sugar
    error:{
        constructor:Error,
        supported:undefined,
        value:undefined,
    },
    evalError:{
        constructor:EvalError,
        supported:undefined,
        value:undefined,
    },
    rangeError:{
        constructor:RangeError,
        supported:undefined,
        value:undefined,
    },
    referenceError:{
        constructor:ReferenceError,
        supported:undefined,
        value:undefined,
    },
    syntaxError:{
        constructor:SyntaxError,
        supported:undefined,
        value:undefined,
    },
    typeError:{
        constructor:TypeError,
        supported:undefined,
        value:undefined,
    },
    URIError:{
        constructor:URIError,
        supported:undefined,
        value:undefined,
    },    
    //typed array sugar
    bigInt64Array:{
        constructor:BigInt64Array,
        supported:undefined,
        value:undefined,
    },
    bigUint64Array:{
        constructor:BigUint64Array,
        supported:undefined,
        value:undefined,
    },
    float32Array:{
        constructor:Float32Array,
        supported:undefined,
        value:undefined,
    },
    float64Array:{
        constructor:Float64Array,
        supported:undefined,
        value:undefined,
    },
    int8Array:{
        constructor:Int8Array,
        supported:undefined,
        value:undefined,
    },
    int16Array:{
        constructor:Int16Array,
        supported:undefined,
        value:undefined,
    },
    int32Array:{
        constructor:Int32Array,
        supported:undefined,
        value:undefined,
    },
    uint8Array:{
        constructor:Uint8Array,
        supported:undefined,
        value:undefined,
    },
    uint8ClampedArray:{
        constructor:Uint8ClampedArray,
        supported:undefined,
        value:undefined,
    },
    uint16Array:{
        constructor:Uint16Array,
        supported:undefined,
        value:undefined,
    },
    uint32Array:{
        constructor:Uint32Array,
        supported:undefined,
        value:undefined,
    },
    //buffers
    arrayBuffer:{
        constructor:ArrayBuffer,
        supported:undefined,
        value:undefined,
    },
    dataView:{
        constructor:DataView,
        supported:undefined,
        value:undefined,
        constructorArgs:[new ArrayBuffer(2)]
    },
    sharedArrayBuffer:{
        constructor:(function(){try{return SharedArrayBuffer}catch{ return Fake}})(),
        supported:undefined,
        value:undefined,
    },
    //Intl (browser internationalization)
    intlDateTimeFormat:{
        constructor:Intl.DateTimeFormat,
        supported:undefined,
        value:undefined,
    },
    intlCollator:{
        constructor:Intl.Collator,
        supported:undefined,
        value:undefined,
    }, 
    intlDisplayNames:{
        constructor:Intl.DisplayNames,
        supported:undefined,
        value:undefined,
        constructorArgs:[['en'], { type: 'region' }]
    }, 
    intlListFormat:{
        constructor:Intl.ListFormat,
        supported:undefined,
        value:undefined,
    }, 
    intlLocale:{
        constructor:Intl.Locale,
        supported:undefined,
        value:undefined,
        constructorArgs:['ja-Jpan-JP-u-ca-japanese-hc-h12']
    }, 
    intlNumberFormat:{
        constructor:Intl.NumberFormat,
        supported:undefined,
        value:undefined,
    }, 
    intlPluralRules:{
        constructor:Intl.PluralRules,
        supported:undefined,
        value:undefined,
    }, 
    intlRelativeTimeFormat:{
        constructor:Intl.RelativeTimeFormat,
        supported:undefined,
        value:undefined,
    }, 
    intlRelativeTimeFormat:{
        constructor:Intl.RelativeTimeFormat,
        supported:undefined,
        value:undefined,
    }, 
    
    //garbage collection
    finalizationRegistry:{
        constructor:FinalizationRegistry,
        supported:undefined,
        value:undefined,
        constructorArgs:[function(){}]
    },
    weakRef:{
        constructor:WeakRef,
        supported:undefined,
        value:undefined,
        constructorArgs:[{}]
    }
}

function testTypeSupport(){
    for(let type in types){
        const entry=types[type];
        if(entry.constructor){
            try{
                if(entry.constructorArgs){
                    //console.log(`using ${type}.constructorArgs new ${entry.constructor}(${entry.constructorArgs})`);
                    entry.value=new entry.constructor(...entry.constructorArgs);
                }else{
                    entry.value=new entry.constructor;
                };
            }catch(err){
                console.log(`failed new ${entry.constructor} : ${err}`);
                entry.supported=false;
            }
        }

        if(entry.supported!==false){
            //console.log(is[type](entry.value))
            entry.supported=is[type](entry.value);
        }
    }
}

testTypeSupport();
export {types as default,types}