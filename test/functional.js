import Is from '../index.js';
import IsNode from '../node.js';
import {equal,suite,test,throws} from './harness.js';

suite('Functional');

const is=new Is;
const weakIs=new Is(false);
const nodeIs=new IsNode;
const weakNodeIs=new IsNode(false);

test('strict mode is enabled by default',()=>equal(new Is().strict,true));
test('non-strict mode is selected explicitly',()=>equal(new Is(false).strict,false));

test('union trims pipe-delimited validator names',()=>equal(is.union('type',' string | number '),true));
test('union accepts an array of validator names',()=>{
    equal(is.union(1,['string','number']),true);
    const names=['string'];
    names[Symbol.iterator]=function*(){yield 'number';};
    equal(is.union('type',names),true);
});
test('union returns false when no validator matches in non-strict mode',()=>equal(weakIs.union({},'string|number'),false));
test('union throws TypeError when no validator matches in strict mode',()=>throws(()=>is.union({},'string|number'),TypeError));
test('union rejects inherited Object methods in non-strict mode',()=>equal(weakIs.union({},'toString'),false));
test('union rejects inherited Object methods in strict mode',()=>throws(()=>is.union({},'toString'),TypeError));

test('union supports a custom subclass validator',()=>{
    class CustomIs extends Is{
        custom(value){
            return this.check(value,value === 'custom','custom');
        }
    }
    equal(new CustomIs().union('custom','number|custom'),true);
});

test('union invokes the winning custom validator once',()=>{
    let calls=0;
    class CountingIs extends Is{
        even(value){
            calls++;
            return this.check(value,value % 2 === 0,'even');
        }
    }
    new CountingIs().union(4,'string|even');
    equal(calls,1);
});

test('union rejects the Node adapter helper in non-strict mode',()=>equal(weakNodeIs.union({},'utilTypeCheck'),false));
test('union rejects the Node adapter helper in strict mode',()=>throws(()=>nodeIs.union({},'utilTypeCheck'),TypeError));
test('the Node adapter inherits core string validation',()=>equal(nodeIs.string('type'),true));
test('the Node adapter inherits core URL validation',()=>equal(nodeIs.url(new URL('https://example.com/')),true));
test('the Node adapter exposes Node validators through union',()=>equal(nodeIs.union(Buffer.from('type'),'buffer|string'),true));
