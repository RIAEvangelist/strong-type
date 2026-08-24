import Is from 'strong-type';

const strictIs=new Is;
const weakIs=new Is(false);

const equal=function(actual,expected,message='values do not match'){
    if(!Object.is(actual,expected)){
        throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
    }
};

const catches=function(check,constructor=Error){
    let error;
    try{
        check();
    }catch(err){
        error=err;
    }
    if(!(error instanceof constructor)){
        throw new Error(`expected ${constructor.name} to be thrown`);
    }
    return error;
};

const deliverOrder=function(order,handler){
    strictIs.plainObject(order);
    strictIs.string(order.id);
    strictIs.safeInteger(order.quantity);
    strictIs.finiteNumber(order.unitPrice);
    return handler(order);
};

const behavioralCore=Object.freeze([
    Object.freeze({
        name:'given a valid decoded order, when its boundary is enforced, then the handler runs once',
        check(){
            const order=JSON.parse('{"id":"order-7","quantity":2,"unitPrice":12.5}');
            let calls=0;
            const total=deliverOrder(order,current=>{
                calls++;
                return current.quantity*current.unitPrice;
            });

            equal(calls,1);
            equal(total,25);
        }
    }),
    Object.freeze({
        name:'given a coercible order quantity, when its boundary is enforced, then the handler stays blocked',
        check(){
            const order=JSON.parse('{"id":"order-7","quantity":"2","unitPrice":12.5}');
            let calls=0;
            const error=catches(()=>deliverOrder(order,()=>{calls++;}),TypeError);

            equal(calls,0);
            equal(error.message,'expected type of string to be safe integer');
        }
    }),
    Object.freeze({
        name:'given mixed untrusted JSON, when weak checks filter it, then only valid records remain unchanged',
        check(){
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
        }
    }),
    Object.freeze({
        name:'given supported and unsupported identifiers, when routing runs, then each receives an observable route',
        check(){
            const route=function(identifier){
                if(!weakIs.union(identifier,'string|safeInteger')){
                    return 'unsupported';
                }
                return typeof identifier === 'string' ? `slug:${identifier}` : `id:${identifier}`;
            };

            equal(route('account'),'slug:account');
            equal(route(42),'id:42');
            equal(route({id:42}),'unsupported');
        }
    }),
    Object.freeze({
        name:'given a domain validator, when records are selected, then direct and union checks share its behavior',
        check(){
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
        }
    }),
    Object.freeze({
        name:'given a structural thenable, when it is classified, then user work is not invoked',
        check(){
            let calls=0;
            const task={then(){calls++;}};

            equal(weakIs.thenable(task),true);
            equal(weakIs.promise(task),false);
            equal(calls,0);
        }
    }),
    Object.freeze({
        name:'given a hostile then getter, when a queue is filtered, then later valid work still queues',
        check(){
            let reads=0;
            const hostile={};
            Object.defineProperty(hostile,'then',{get(){reads++;throw new Error('hostile getter');}});
            const safe={then(){}};
            const queued=[hostile,safe].filter(value=>weakIs.thenable(value));

            equal(reads,1);
            equal(queued.length,1);
            equal(queued[0],safe);
        }
    })
]);

const runBehavioralCore=async function(){
    const passed=[];
    const failed=[];

    for(const current of behavioralCore){
        try{
            await current.check();
            passed.push(current.name);
        }catch(error){
            failed.push(`${current.name}: ${error && error.message ? error.message : String(error)}`);
        }
    }

    const frozenPassed=Object.freeze(passed);
    const frozenFailed=Object.freeze(failed);
    return Object.freeze({
        ok:frozenFailed.length === 0,
        failureCount:frozenFailed.length,
        total:frozenPassed.length+frozenFailed.length,
        passed:frozenPassed,
        failed:frozenFailed,
        report:frozenFailed.length ? frozenFailed.join('\n') : `${frozenPassed.length} native-browser behaviors passed`
    });
};

export {behavioralCore,deliverOrder,runBehavioralCore};
export default runBehavioralCore;
