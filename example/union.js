import Is from 'strong-type';

const is=new Is();

console.log(
    is.union({a:1},'string|number|borked')

);
