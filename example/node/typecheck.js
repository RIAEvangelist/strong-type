let is,support;

const modules={
    Is:{
        path:'../../index.js',
        default:null
    },
    support:{
        path:'../../typeSupport.js',
        default:null
    }
}

async function getModules(){
    for(let module in modules){
        const {default:moduleDefault} = await import(modules[module].path);
        modules[module].default=moduleDefault;
        modulesImported();
    }
}

function modulesImported(){
    is=new modules.Is.default;
    support=modules.support.default;
    for(let type in support){
        const green='\x1b[42m%s\x1b';
        const red='\x1b[41m%s\x1b';
        console.log(
            support[type].supported? green:red,
            `${type} : ${support[type].supported}`
        );
    }

    console.log('\x1b[0m');
}

getModules();