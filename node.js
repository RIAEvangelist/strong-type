import Is from './index.js';
import * as util from 'node:util';
import * as stream from 'node:stream';
import * as events from 'node:events';
import * as crypto from 'node:crypto';

let timeoutConstructor;
let immediateConstructor;

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

const timerConstructor=function(type){
    if(type === 'timeout' && !timeoutConstructor){
        const timeout=setTimeout(()=>{},0);
        clearTimeout(timeout);
        timeoutConstructor=timeout.constructor;
    }

    if(type === 'immediate' && !immediateConstructor && typeof setImmediate === 'function'){
        const immediate=setImmediate(()=>{});
        clearImmediate(immediate);
        immediateConstructor=immediate.constructor;
    }

    return type === 'timeout' ? timeoutConstructor : immediateConstructor;
};

class IsNode extends Is{
    utilTypeCheck(value,method,typeName){
        const check=util.types && util.types[method];
        let pass=false;
        try{
            pass=typeof check === 'function' && check(value);
        }catch(err){
            pass=false;
        }
        return this.check(value,pass,typeName);
    }

    buffer(value){
        return this.check(value,Buffer.isBuffer(value),'Buffer');
    }

    nodeStream(value){
        return this.check(value,instanceOf(value,stream.Stream),'Node Stream');
    }

    nodeReadable(value){
        return this.check(value,instanceOf(value,stream.Readable),'Node Readable');
    }

    nodeWritable(value){
        return this.check(value,instanceOf(value,stream.Writable),'Node Writable');
    }

    nodeDuplex(value){
        return this.check(value,instanceOf(value,stream.Duplex),'Node Duplex');
    }

    nodeTransform(value){
        return this.check(value,instanceOf(value,stream.Transform),'Node Transform');
    }

    nodePassThrough(value){
        return this.check(value,instanceOf(value,stream.PassThrough),'Node PassThrough');
    }

    eventEmitter(value){
        return this.check(value,instanceOf(value,events.EventEmitter),'EventEmitter');
    }

    timeout(value){
        const constructor=timerConstructor('timeout');
        return this.check(value,instanceOf(value,constructor),'Timeout');
    }

    immediate(value){
        const constructor=timerConstructor('immediate');
        return this.check(value,instanceOf(value,constructor),'Immediate');
    }

    keyObject(value){
        return this.check(value,instanceOf(value,crypto.KeyObject),'KeyObject');
    }

    x509Certificate(value){
        return this.check(value,instanceOf(value,crypto.X509Certificate),'X509Certificate');
    }

    proxy(value){
        return this.utilTypeCheck(value,'isProxy','Proxy');
    }

    moduleNamespaceObject(value){
        return this.utilTypeCheck(value,'isModuleNamespaceObject','module namespace object');
    }

    external(value){
        return this.utilTypeCheck(value,'isExternal','native external value');
    }

    nativeError(value){
        return this.utilTypeCheck(value,'isNativeError','native Error');
    }

    mapIterator(value){
        return this.utilTypeCheck(value,'isMapIterator','Map iterator');
    }

    setIterator(value){
        return this.utilTypeCheck(value,'isSetIterator','Set iterator');
    }
}

export {IsNode as default,IsNode};
