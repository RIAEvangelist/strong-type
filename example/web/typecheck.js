import types from '../typeSupport.js';

const template=document.querySelector('template').innerHTML;
const tableBody=document.querySelector('tbody');
let results='';

for(let type in types){
    populateTemplate(type,types[type])
}
tableBody.innerHTML=results;


function populateTemplate(type,data){
    //console.log(type,data);
    results+=template.replace('${js}',type)
        .replace('${supported}',data.supported)
        .replace('${typeData}',data.supported);
}
