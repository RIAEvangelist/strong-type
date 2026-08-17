const tests=[];
const cleanups=[];
const descriptions=new Set;
const quiet=typeof process !== 'undefined' && process.env.STRONG_TYPE_TEST_QUIET === '1';
let activeSuite='';
let cleanupPromise;

const suite=function(name){
    if(typeof name !== 'string' || !name.trim()){
        throw new TypeError('suite name must be a nonempty string');
    }
    activeSuite=name.trim();
};

const description=function(name){
    if(typeof name !== 'string' || !name.trim()){
        throw new TypeError('test name must be a nonempty string');
    }
    const value=activeSuite ? `${activeSuite} · ${name.trim()}` : name.trim();
    if(descriptions.has(value)){
        throw new Error(`duplicate test description: ${value}`);
    }
    descriptions.add(value);
    return value;
};

const test=function(name,check){
    tests.push({name:description(name),suite:activeSuite || 'Uncategorized',check});
};

const skip=function(name,reason){
    tests.push({name:description(name),suite:activeSuite || 'Uncategorized',reason,skip:true});
};

const after=function(callback){
    if(typeof callback !== 'function'){
        throw new TypeError('cleanup must be a function');
    }
    cleanups.push(callback);
};

const cleanup=function(){
    if(cleanupPromise){
        return cleanupPromise;
    }
    cleanupPromise=(async function(){
        let firstError;
        while(cleanups.length){
            try{
                await cleanups.pop()();
            }catch(err){
                if(!firstError){
                    firstError=err;
                }
            }
        }
        if(firstError){
            throw firstError;
        }
    })();
    return cleanupPromise;
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

const reportSuites=function(){
    const summaries=new Map;
    for(const current of tests){
        if(!summaries.has(current.suite)){
            summaries.set(current.suite,{passed:0,failed:0,skipped:0});
        }
        const summary=summaries.get(current.suite);
        if(current.skip){
            summary.skipped++;
        }else if(current.outcome === 'passed'){
            summary.passed++;
        }else{
            summary.failed++;
        }
    }

    console.log('\nSuite results');
    for(const [name,summary] of summaries){
        console.log(`${name}: ${summary.passed} passed | ${summary.failed} failed | ${summary.skipped} skipped`);
    }
};

const runVanilla=async function(){
    const {default:VanillaTest}=await import('vanilla-test');
    const runner=new VanillaTest;
    let skipped=0;

    for(const current of tests){
        if(current.skip){
            current.outcome='skipped';
            skipped++;
            if(!quiet){
                console.log(`- ${current.name} (${current.reason})`);
            }
            continue;
        }

        runner.expects(current.name);
        try{
            await current.check();
            current.outcome='passed';
            runner.pass();
        }catch(err){
            current.outcome='failed';
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
    reportSuites();
    return result;
};

const runFallback=async function(){
    let passed=0;
    let failed=0;
    let skipped=0;

    for(const current of tests){
        if(current.skip){
            current.outcome='skipped';
            skipped++;
            if(!quiet){
                console.log(`- ${current.name} (${current.reason})`);
            }
            continue;
        }

        try{
            await current.check();
            current.outcome='passed';
            passed++;
            if(!quiet){
                console.log(`✓ ${current.name}`);
            }
        }catch(err){
            current.outcome='failed';
            failed++;
            console.error(`✗ ${current.name}`);
            console.error(err && err.stack ? err.stack : err);
        }
    }

    console.log(`\n${passed} passed | ${failed} failed | ${skipped} skipped`);
    if(failed){
        process.exitCode=1;
    }
    reportSuites();
    return Object.freeze({
        ok:failed === 0,
        failureCount:failed,
        passedCount:passed,
        skippedCount:skipped
    });
};

const run=async function(){
    try{
        return await (vanillaTestAvailable() ? runVanilla() : runFallback());
    }finally{
        await cleanup();
    }
};

export {after,assert,cleanup,equal,run,skip,suite,test,throws};
