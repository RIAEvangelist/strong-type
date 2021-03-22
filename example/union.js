import Is from '../index.js';

const is=new Is();

console.log(
    is.union({a:1},'string|number|borked')

);