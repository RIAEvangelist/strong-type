import {runSuites} from '../test/entry.js';
import {suiteNames,suites} from '../test/suites.js';

const requested=process.argv[2];
const legacy=requested === 'legacy';
const selected=!requested || legacy ? suiteNames : [requested];

if(!legacy && requested && !Object.prototype.hasOwnProperty.call(suites,requested)){
    console.error(`unknown test suite: ${requested}`);
    process.exit(1);
}

if(legacy){
    process.env.STRONG_TYPE_TEST_LEGACY='1';
}

runSuites(selected).catch(err=>{
    console.error(err && err.stack ? err.stack : err);
    process.exitCode=1;
});
