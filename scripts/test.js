import {spawnSync} from 'child_process';

const groups={
    all:['test/CI.js','test/node.js','test/docs.js'],
    core:['test/CI.js'],
    node:['test/node.js'],
    docs:['test/docs.js']
};

const requested=process.argv[2] || 'all';
const legacy=requested === 'legacy';
const files=legacy ? groups.all : groups[requested];

if(!files){
    console.error(`unknown test group: ${requested}`);
    process.exit(1);
}

const execute=function(args,environment=process.env){
    const result=spawnSync(process.execPath,args,{env:environment,stdio:'inherit'});
    if(result.error){
        throw result.error;
    }
    if(result.status !== 0){
        process.exit(result.status === null ? 1 : result.status);
    }
};

const environment=legacy ? {...process.env,STRONG_TYPE_TEST_LEGACY:'1'} : process.env;
for(const file of files){
    execute([file],environment);
}
