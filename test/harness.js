const tests=[];
const quiet=typeof process !== 'undefined' && process.env.STRONG_TYPE_TEST_QUIET === '1';

const test=function(name,check){
    tests.push({name,check});
};

const skip=function(name,reason){
    tests.push({name,reason,skip:true});
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

const vanillaTestAvailable=function(){
    if(typeof process === 'undefined' || !process.versions || !process.versions.node){
        return false;
    }

    if(process.env.STRONG_TYPE_TEST_LEGACY === '1'){
        return false;
    }

    const [major,minor]=process.versions.node.split('.').map(Number);
    return major > 22 || (major === 22 && minor >= 12);
};

const runVanilla=async function(){
    const {default:VanillaTest}=await import('vanilla-test');
    const runner=new VanillaTest;
    let skipped=0;

    for(const current of tests){
        if(current.skip){
            skipped++;
            if(!quiet){
                console.log(`- ${current.name} (${current.reason})`);
            }
            continue;
        }

        runner.expects(current.name);
        try{
            await current.check();
            runner.pass();
        }catch(err){
            console.error(`✗ ${current.name}`);
            console.error(err && err.stack ? err.stack : err);
            runner.fail();
        }finally{
            runner.done();
        }
    }

    const result=runner.report();
    if(skipped && !quiet){
        console.log(`${skipped} skipped`);
    }
    if(!result.ok){
        process.exitCode=1;
    }
    return result;
};

const runFallback=async function(){
    let passed=0;
    let failed=0;
    let skipped=0;

    for(const current of tests){
        if(current.skip){
            skipped++;
            if(!quiet){
                console.log(`- ${current.name} (${current.reason})`);
            }
            continue;
        }

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

const run=function(){
    return vanillaTestAvailable() ? runVanilla() : runFallback();
};

export {assert,equal,run,skip,test,throws};
