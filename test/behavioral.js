import IsNode from 'strong-type/node';
import {behavioralCore} from './behavioral-core.js';
import {equal,suite,test,throws} from './harness.js';

suite('Behavioral');

const strictNodeIs=new IsNode;

for(const current of behavioralCore){
    test(current.name,current.check);
}

test('given Buffer and typed-array uploads, when persistence is guarded, then only the Buffer is stored',()=>{
    const stored=[];
    const persist=function(value){
        strictNodeIs.buffer(value);
        stored.push(value);
        return value.toString('utf8');
    };
    const upload=Buffer.from('payload');

    equal(persist(upload),'payload');
    const error=throws(()=>persist(new Uint8Array([1,2,3])),TypeError);
    equal(error.message,'expected type of object to be Buffer');
    equal(stored.length,1);
    equal(stored[0],upload);
});
