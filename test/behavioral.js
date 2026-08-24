import Is from '../index.js';
import IsNode from '../node.js';
import {equal,suite,test,throws} from './harness.js';

suite('Behavioral');

const strictIs=new Is;
const weakIs=new Is(false);
const strictNodeIs=new IsNode;

const deliverOrder=function(order,handler){
    strictIs.plainObject(order);
    strictIs.string(order.id);
    strictIs.safeInteger(order.quantity);
    strictIs.finiteNumber(order.unitPrice);
    return handler(order);
};

test('given a valid decoded order, when its boundary is enforced, then the handler runs once',()=>{
    const order=JSON.parse('{"id":"order-7","quantity":2,"unitPrice":12.5}');
    let calls=0;
    const total=deliverOrder(order,current=>{
        calls++;
        return current.quantity*current.unitPrice;
    });

    equal(calls,1);
    equal(total,25);
});

test('given a coercible order quantity, when its boundary is enforced, then the handler stays blocked',()=>{
    const order=JSON.parse('{"id":"order-7","quantity":"2","unitPrice":12.5}');
    let calls=0;
    const error=throws(()=>deliverOrder(order,()=>{calls++;}),TypeError);

    equal(calls,0);
    equal(error.message,'expected type of string to be safe integer');
});

test('given mixed untrusted JSON, when weak checks filter it, then only valid records remain unchanged',()=>{
    const records=JSON.parse('[{"id":1,"payload":"ready"},{"id":2,"payload":4.5},{"id":"3","payload":"not coerced"},{"id":4,"payload":null},null]');
    const accepted=records.filter(record=>{
        return weakIs.plainObject(record) &&
            weakIs.safeInteger(record.id) &&
            weakIs.union(record.payload,'string|finiteNumber');
    });

    equal(accepted.length,2);
    equal(accepted[0],records[0]);
    equal(accepted[1],records[1]);
    equal(records[2].id,'3');
});

test('given supported and unsupported identifiers, when routing runs, then each receives an observable route',()=>{
    const route=function(identifier){
        if(!weakIs.union(identifier,'string|safeInteger')){
            return 'unsupported';
        }
        return typeof identifier === 'string' ? `slug:${identifier}` : `id:${identifier}`;
    };

    equal(route('account'),'slug:account');
    equal(route(42),'id:42');
    equal(route({id:42}),'unsupported');
});

test('given a domain validator, when records are selected, then direct and union checks share its behavior',()=>{
    class DomainIs extends Is{
        orderIdentifier(value){
            return this.check(value,typeof value === 'string' && /^order-[1-9][0-9]*$/.test(value),'order identifier');
        }
    }

    const domainIs=new DomainIs;
    const weakDomainIs=new DomainIs(false);
    const record={id:'order-17'};
    const select=function(current,validator){
        if(!validator.plainObject(current) || !validator.union(current.id,'orderIdentifier|safeInteger')){
            return false;
        }
        return current;
    };

    equal(domainIs.orderIdentifier(record.id),true);
    equal(select(record,domainIs),record);
    equal(select({id:17},weakDomainIs).id,17);
    equal(select({id:'draft'},weakDomainIs),false);
});

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

test('given a structural thenable, when it is classified, then user work is not invoked',()=>{
    let calls=0;
    const task={then(){calls++;}};

    equal(weakIs.thenable(task),true);
    equal(weakIs.promise(task),false);
    equal(calls,0);
});

test('given a hostile then getter, when a queue is filtered, then later valid work still queues',()=>{
    let reads=0;
    const hostile={};
    Object.defineProperty(hostile,'then',{get(){reads++;throw new Error('hostile getter');}});
    const safe={then(){}};
    const queued=[hostile,safe].filter(value=>weakIs.thenable(value));

    equal(reads,1);
    equal(queued.length,1);
    equal(queued[0],safe);
});
