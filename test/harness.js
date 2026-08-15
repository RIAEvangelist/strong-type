const tests=[];
let passed=0;
let failed=0;
let skipped=0;
const quiet=typeof process !== 'undefined' && process.env.STRONG_TYPE_TEST_QUIET === '1';

const test=function(name,check){
    tests.push({name,check});
};

const skip=function(name,reason){
    skipped++;
    if(!quiet){
        console.log(`- ${name} (${reason})`);
    }
};

const assert=function(value,message='assertion failed'){
    if(!value){
        throw new Error(message);
    }
};

const equal=function(actual,expected,message='values do not match'){
    if(!Object.is(actual,expected)){
        throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
    }
};

const throws=function(check,constructor=Error){
    let error;
    try{
        check();
    }catch(err){
        error=err;
    }

    assert(error instanceof constructor,`expected ${constructor.name} to be thrown`);
    return error;
};

const run=async function(){
    for(const current of tests){
        try{
            await current.check();
            passed++;
            if(!quiet){
                console.log(`✓ ${current.name}`);
            }
        }catch(err){
            failed++;
            console.error(`✗ ${current.name}`);
            console.error(err && err.stack ? err.stack : err);
        }
    }

    console.log(`\n${passed} passed | ${failed} failed | ${skipped} skipped`);
    if(failed){
        process.exitCode=1;
    }
};

export {assert,equal,run,skip,test,throws};
