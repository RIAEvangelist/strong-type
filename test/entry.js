import {pathToFileURL} from 'url';
import {cleanup,run} from './harness.js';
import {suiteNames,suites} from './suites.js';

const selectSuites=function(names){
    const selected=names && names.length ? names : suiteNames;
    for(const name of selected){
        if(!Object.prototype.hasOwnProperty.call(suites,name)){
            throw new Error(`unknown test suite: ${name}`);
        }
    }
    return selected;
};

const runSuites=async function(names){
    const selected=selectSuites(names);
    console.log(`Registered suites: ${selected.map(name=>suites[name].label).join(', ')}`);
    try{
        for(const name of selected){
            await import(suites[name].module);
        }
        return await run();
    }catch(err){
        await cleanup();
        throw err;
    }
};

const runAll=function(){
    return runSuites(suiteNames);
};

const direct=process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if(direct){
    runSuites(process.argv.slice(2)).catch(err=>{
        console.error(err && err.stack ? err.stack : err);
        process.exitCode=1;
    });
}

export {runAll as run,runSuites};
export default runAll;
