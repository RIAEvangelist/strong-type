import types from '../typeSupport.js';

for(let type in types){
    const green='\x1b[42m%s\x1b';
    const red='\x1b[41m%s\x1b';
    console.log(
        types[type].supported? green:red,
        `${type} : ${types[type].supported}`
    );
}

console.log('\x1b[0m');
