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

const template=document.querySelector('template').innerHTML;
const tableBody=document.querySelector('tbody');
let results='';


async function getModules(){
    for(module in modules){
        const {default:moduleDefault} = await import(modules[module].path);
        modules[module].default=moduleDefault;
        modulesImported();
    }
}

function modulesImported(){
    is=new modules.Is.default;
    support=modules.support.default;
    for(type in support){
        populateTemplate(type,support[type])
    }
    tableBody.innerHTML=results;
}

function populateTemplate(type,data){
    //console.log(type,data);
    results+=template.replace('${js}',type)
        .replace('${supported}',data.supported)
        .replace('${typeData}',data.supported);
}

getModules();