import {execFileSync} from 'node:child_process';
import Is from '../index.js';

const targetSampleMs=100;
const sampleCount=7;
const minimumIterations=1_000;
const maximumIterations=50_000_000;
const fixtureCount=64;
const fixtureMask=fixtureCount-1;
const historical=process.argv.includes('--historical');
const baseline=process.argv.includes('--baseline');
const historicalCommit='3229b47';
const baselineCommit='700059a';
let sink=0;
let compareConversions=0;
let runnerSequence=0;

const median=function(values){
    const sorted=values.slice().sort((left,right)=>left-right);
    return sorted[Math.floor(sorted.length/2)];
};

const medianAbsoluteDeviation=function(values,center){
    return median(values.map(value=>Math.abs(value-center)));
};

const runnerFor=function(current){
    // A separately compiled loop keeps V8 feedback local to one case and implementation.
    const name=`strongTypeBenchmark${runnerSequence++}`;
    const create=Function('check','expected','hrtime',`
        return function ${name}(iterations){
            let matches=0;
            const start=hrtime();
            for(let index=0;index<iterations;index++){
                matches+=check(index) === expected ? 1 : 0;
            }
            return [matches,Number(hrtime()-start)];
        };
    `);
    return create(current.check,current.expected,process.hrtime.bigint);
};

const elapsed=function(current,iterations){
    const [matches,nanoseconds]=current.run(iterations);
    if(matches !== iterations){
        throw new Error(`${current.name} returned an unexpected result after ${matches.toLocaleString('en-US')} of ${iterations.toLocaleString('en-US')} iterations`);
    }
    sink=(sink+matches+iterations)|0;
    return nanoseconds/1e6;
};

const calibrate=function(current){
    let iterations=20_000;
    let duration=elapsed(current,iterations);
    let warmupDuration=duration;
    while((duration < targetSampleMs/4 || warmupDuration < 50) && iterations < maximumIterations){
        const scale=Math.max(2,Math.min(10,Math.ceil((targetSampleMs/Math.max(duration,0.01))/2)));
        iterations=Math.min(maximumIterations,iterations*scale);
        duration=elapsed(current,iterations);
        warmupDuration+=duration;
    }
    const projected=Math.round(iterations*(targetSampleMs/Math.max(duration,0.01)));
    return Math.max(minimumIterations,Math.min(maximumIterations,projected));
};

const summarize=function(name,iterations,samples){
    const duration=median(samples);
    const deviation=medianAbsoluteDeviation(samples,duration);
    const nanoseconds=duration*1e6/iterations;
    return {
        name,
        iterations,
        nanoseconds,
        operationsPerSecond:1e9/nanoseconds,
        deviationPercent:duration ? deviation/duration*100 : 0
    };
};

const benchmark=function(current){
    const iterations=calibrate(current);
    const samples=[];
    for(let sample=0;sample<sampleCount;sample++){
        samples.push(elapsed(current,iterations));
    }
    return summarize(current.name,iterations,samples);
};

const benchmarkPair=function(current,baseline,baselineFirst){
    let currentIterations;
    let baselineIterations;
    if(baselineFirst){
        baselineIterations=calibrate(baseline);
        currentIterations=calibrate(current);
    }else{
        currentIterations=calibrate(current);
        baselineIterations=calibrate(baseline);
    }
    const currentSamples=[];
    const baselineSamples=[];
    for(let sample=0;sample<sampleCount;sample++){
        const runBaselineFirst=sample%2 === 0 ? baselineFirst : !baselineFirst;
        if(runBaselineFirst){
            baselineSamples.push(elapsed(baseline,baselineIterations));
            currentSamples.push(elapsed(current,currentIterations));
        }else{
            currentSamples.push(elapsed(current,currentIterations));
            baselineSamples.push(elapsed(baseline,baselineIterations));
        }
    }
    return {
        current:summarize(current.name,currentIterations,currentSamples),
        baseline:summarize(baseline.name,baselineIterations,baselineSamples)
    };
};

const fixtures=function(create){
    return Array.from({length:fixtureCount},(_,index)=>create(index));
};

const numbers=fixtures(index=>index+0.25);
const definedValues=fixtures(index=>index%2 ? index : null);
const plainObjects=fixtures(index=>({index}));
const arrays=fixtures(index=>[index]);
const nullPrototypeObjects=fixtures(index=>Object.assign(Object.create(null),{index}));
const dates=fixtures(index=>new Date(1_700_000_000_000+index));
const maps=fixtures(index=>new Map([['index',index]]));
const sets=fixtures(index=>new Set([index]));
const regularExpressions=fixtures(index=>new RegExp(String(index),'u'));
const arrayBuffers=fixtures(()=>new ArrayBuffer(8));
const sharedArrayBuffers=typeof SharedArrayBuffer === 'function' ? fixtures(()=>new SharedArrayBuffer(8)) : [];
const dataViews=arrayBuffers.map(buffer=>new DataView(buffer));
const uint8Arrays=fixtures(index=>new Uint8Array([index]));
const boxedValues=fixtures(index=>{
    const type=index%5;
    if(type === 0) return Object(Boolean(index%2));
    if(type === 1) return Object(index);
    if(type === 2) return Object(BigInt(index));
    if(type === 3) return Object(String(index));
    return Object(Symbol(String(index)));
});
const comparableValues=fixtures(()=>Object.freeze({
    toString(){
        compareConversions++;
        return 'comparable';
    }
}));
const baselineComparableValues=fixtures(()=>Object.freeze({
    toString(){
        return 'comparable';
    }
}));

const makeCase=function(name,expected,check){
    const current={name,expected,check};
    current.run=runnerFor(current);
    return current;
};

const currentCases=function(Class){
    const is=new Class;
    const weakIs=new Class(false);
    const comparisonValues=Class === Is ? comparableValues : baselineComparableValues;
    const cases=[
        makeCase('number/pass',true,index=>weakIs.number(numbers[index&fixtureMask])),
        makeCase('number/fail',false,index=>weakIs.number(plainObjects[index&fixtureMask])),
        makeCase('compare/pass',true,index=>weakIs.compare(comparisonValues[index&fixtureMask],comparisonValues[index&fixtureMask])),
        makeCase('array/pass',true,index=>weakIs.array(arrays[index&fixtureMask])),
        makeCase('array/fail',false,index=>weakIs.array(plainObjects[index&fixtureMask])),
        makeCase('nullPrototypeObject/pass',true,index=>weakIs.nullPrototypeObject(nullPrototypeObjects[index&fixtureMask])),
        makeCase('nullPrototypeObject/fail',false,index=>weakIs.nullPrototypeObject(plainObjects[index&fixtureMask])),
        makeCase('date/pass',true,index=>weakIs.date(dates[index&fixtureMask])),
        makeCase('date/fail',false,index=>weakIs.date(plainObjects[index&fixtureMask])),
        makeCase('validDate/pass',true,index=>weakIs.validDate(dates[index&fixtureMask])),
        makeCase('map/pass',true,index=>weakIs.map(maps[index&fixtureMask])),
        makeCase('map/fail',false,index=>weakIs.map(plainObjects[index&fixtureMask])),
        makeCase('arrayBufferView/pass',true,index=>weakIs.arrayBufferView(uint8Arrays[index&fixtureMask])),
        makeCase('typedArray/pass',true,index=>weakIs.typedArray(uint8Arrays[index&fixtureMask])),
        makeCase('uint8Array/pass',true,index=>weakIs.uint8Array(uint8Arrays[index&fixtureMask])),
        makeCase('uint8Array/reject-data-view',false,index=>weakIs.uint8Array(dataViews[index&fixtureMask])),
        makeCase('boxedPrimitive/pass',true,index=>weakIs.boxedPrimitive(boxedValues[index&fixtureMask])),
        makeCase('union/first',true,index=>is.union(numbers[index&fixtureMask],'number|string|boolean')),
        makeCase('union/second',true,index=>is.union(String(index&fixtureMask),'number|string|boolean')),
        makeCase('union/miss',false,index=>weakIs.union(plainObjects[index&fixtureMask],'number|string|boolean'))
    ];

    if(sharedArrayBuffers.length){
        cases.push(makeCase('anyArrayBuffer/pass-shared',true,index=>weakIs.anyArrayBuffer(sharedArrayBuffers[index&fixtureMask])));
    }

    if(typeof Intl.DateTimeFormat === 'function'){
        const formats=fixtures(index=>new Intl.DateTimeFormat(index%2 ? 'en' : 'fr'));
        cases.push(makeCase('intlDateTimeFormat/pass',true,index=>weakIs.intlDateTimeFormat(formats[index&fixtureMask])));
    }

    if(typeof Intl.Segmenter === 'function'){
        const segments=fixtures(index=>new Intl.Segmenter(index%2 ? 'en' : 'fr').segment(`strong type ${index}`));
        cases.push(makeCase('intlSegments/pass',true,index=>weakIs.intlSegments(segments[index&fixtureMask])));
    }

    const resizableArrayBuffers=fixtures(()=>new ArrayBuffer(8,{maxByteLength:16}));
    if(resizableArrayBuffers[0].resizable === true){
        cases.push(makeCase('resizableArrayBuffer/pass',true,index=>weakIs.resizableArrayBuffer(resizableArrayBuffers[index&fixtureMask])));
    }
    return cases;
};

const comparableCases=function(Class){
    const is=new Class;
    const weakIs=new Class(false);
    return [
        makeCase('defined/pass',true,index=>weakIs.defined(definedValues[index&fixtureMask])),
        makeCase('number/pass',true,index=>weakIs.number(numbers[index&fixtureMask])),
        makeCase('array/pass',true,index=>weakIs.array(arrays[index&fixtureMask])),
        makeCase('date/pass',true,index=>weakIs.date(dates[index&fixtureMask])),
        makeCase('map/pass',true,index=>weakIs.map(maps[index&fixtureMask])),
        makeCase('set/pass',true,index=>weakIs.set(sets[index&fixtureMask])),
        makeCase('regExp/pass',true,index=>weakIs.regExp(regularExpressions[index&fixtureMask])),
        makeCase('uint8Array/pass',true,index=>weakIs.uint8Array(uint8Arrays[index&fixtureMask])),
        makeCase('arrayBuffer/pass',true,index=>weakIs.arrayBuffer(arrayBuffers[index&fixtureMask])),
        makeCase('dataView/pass',true,index=>weakIs.dataView(dataViews[index&fixtureMask])),
        makeCase('union/first',true,index=>is.union(numbers[index&fixtureMask],'number|string')),
        makeCase('union/second',true,index=>is.union(String(index&fixtureMask),'number|string'))
    ];
};

const git=function(args){
    try{
        return execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','ignore'],windowsHide:true}).trim();
    }catch(err){
        return '';
    }
};

const classAtCommit=async function(targetCommit){
    let source;
    try{
        source=execFileSync('git',['show',`${targetCommit}:index.js`],{encoding:'utf8',windowsHide:true});
    }catch(err){
        throw new Error(`unable to load benchmark source from ${targetCommit}`);
    }
    const module=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${targetCommit}`);
    return module.default;
};

const commit=git(['rev-parse','--short','HEAD']) || 'unavailable';
const revisionState=commit === 'unavailable' ? 'Git unavailable' : git(['status','--porcelain','--untracked-files=no']) ? 'dirty' : 'clean';

console.log(`Runtime: Node ${process.version} | V8 ${process.versions.v8} | ${process.platform} ${process.arch}`);
console.log(`Revision: ${commit} (${revisionState})`);
console.log(`Method: ${targetSampleMs} ms target | ${sampleCount} samples | dedicated per-case loops | median and median absolute deviation`);
console.log('Note: ns/op is harness-specific JIT throughput, not end-to-end application latency.');

const diagnostics=[
    ['number fail/pass','number/fail','number/pass'],
    ['array fail/pass','array/fail','array/pass'],
    ['null-prototype fail/pass','nullPrototypeObject/fail','nullPrototypeObject/pass'],
    ['validDate/date','validDate/pass','date/pass'],
    ['uint8Array/arrayBufferView','uint8Array/pass','arrayBufferView/pass'],
    ['union second/first','union/second','union/first'],
    ['union miss/first','union/miss','union/first']
];

const printCurrentResults=function(results){
    const nameWidth=Math.max(...results.map(result=>result.name.length));
    console.log(`\n${'case'.padEnd(nameWidth)}  ${'ns/op'.padStart(12)}  ${'ops/sec'.padStart(14)}  ${'MAD'.padStart(8)}  ${'iterations'.padStart(12)}`);
    for(const result of results){
        console.log(`${result.name.padEnd(nameWidth)}  ${result.nanoseconds.toFixed(2).padStart(12)}  ${Math.round(result.operationsPerSecond).toLocaleString('en-US').padStart(14)}  ${(result.deviationPercent.toFixed(2)+'%').padStart(8)}  ${result.iterations.toLocaleString('en-US').padStart(12)}`);
    }

    const byName=new Map(results.map(result=>[result.name,result]));
    console.log('\nDiagnostic ratios');
    for(const [label,numeratorName,denominatorName] of diagnostics){
        const numerator=byName.get(numeratorName);
        const denominator=byName.get(denominatorName);
        if(numerator && denominator){
            console.log(`${label}: ${(numerator.nanoseconds/denominator.nanoseconds).toFixed(2)}x`);
        }
    }
};

const printPairs=function(pairs,baselineLabel){
    const nameWidth=Math.max(...pairs.map(pair=>pair.current.name.length));
    console.log(`${'case'.padEnd(nameWidth)}  ${'current ns'.padStart(12)}  ${'current MAD'.padStart(11)}  ${baselineLabel.padStart(12)}  ${'base MAD'.padStart(9)}  ${'speedup'.padStart(10)}`);
    for(const pair of pairs){
        const speedup=pair.baseline.nanoseconds/pair.current.nanoseconds;
        console.log(`${pair.current.name.padEnd(nameWidth)}  ${pair.current.nanoseconds.toFixed(2).padStart(12)}  ${(pair.current.deviationPercent.toFixed(2)+'%').padStart(11)}  ${pair.baseline.nanoseconds.toFixed(2).padStart(12)}  ${(pair.baseline.deviationPercent.toFixed(2)+'%').padStart(9)}  ${(speedup.toFixed(2)+'x').padStart(10)}`);
    }
};

const runComparisons=async function(){
    if(!baseline && !historical){
        printCurrentResults(currentCases(Is).map(benchmark));
    }

    if(baseline){
        const BaselineIs=await classAtCommit(baselineCommit);
        const currentBaselineCases=currentCases(Is);
        const baselineCases=currentCases(BaselineIs);
        const pairs=currentBaselineCases.map((current,index)=>benchmarkPair(current,baselineCases[index],Boolean(index%2)));
        console.log(`\nPre-optimization comparison: current vs ${baselineCommit}`);
        printPairs(pairs,'baseline ns');
    }

    if(historical){
        const HistoricalIs=await classAtCommit(historicalCommit);
        const currentComparable=comparableCases(Is);
        const baselineComparable=comparableCases(HistoricalIs);
        const pairs=currentComparable.map((current,index)=>benchmarkPair(current,baselineComparable[index],Boolean(index%2)));
        console.log(`\nHistorical throughput reference: current vs 1.1.0 (${historicalCommit})`);
        console.log('These same-realm positive paths overlap behaviorally; 1.1.0 does not provide the current cross-realm and spoof guarantees.');
        printPairs(pairs,'1.1.0 ns');
    }

    if(compareConversions){
        throw new Error(`compare/pass stringified its successful target ${compareConversions.toLocaleString('en-US')} times`);
    }

    console.log(`\nCorrectness checksum: ${sink>>>0}`);
};

runComparisons().catch(err=>{
    console.error(err && err.stack ? err.stack : err);
    process.exitCode=1;
});
