const defaultSource=`import Is from 'strong-type';

const is=new Is;
const weakIs=new Is(false);

console.log('string',is.string('native ESM'));
console.log('number',weakIs.number('42'));
console.log('union',is.union(new Map,'map|set'));

try{
    is.number('42');
}catch(err){
    console.error(err);
}`;

const source=document.querySelector('#source');
const output=document.querySelector('#output');
const runButton=document.querySelector('#run');
let runNumber=0;

const serialize=function(value,seen=new WeakSet){
    if(typeof value === 'bigint'){
        return `${value}n`;
    }
    if(typeof value === 'symbol' || typeof value === 'function'){
        return String(value);
    }
    if(value instanceof Error){
        return `${value.name}: ${value.message}`;
    }
    if(value === undefined){
        return 'undefined';
    }
    if(value === null || typeof value !== 'object'){
        return typeof value === 'string' ? value : String(value);
    }
    if(seen.has(value)){
        return '[Circular]';
    }
    seen.add(value);
    if(value instanceof Map){
        return `Map(${value.size}) ${serialize([...value],seen)}`;
    }
    if(value instanceof Set){
        return `Set(${value.size}) ${serialize([...value],seen)}`;
    }
    try{
        return JSON.stringify(value,(key,current)=>typeof current === 'bigint' ? `${current}n` : current,2);
    }catch(err){
        return Object.prototype.toString.call(value);
    }
};

const write=function(level,values){
    const item=document.createElement('li');
    item.className=level;
    item.dataset.level=level;
    item.textContent=values.map(value=>serialize(value)).join(' ');
    output.append(item);
    output.scrollTop=output.scrollHeight;
};

const run=async function(){
    const current=++runNumber;
    output.replaceChildren();
    runButton.disabled=true;
    runButton.textContent='Running…';
    const original={};
    for(const level of ['log','info','warn','error']){
        original[level]=console[level];
        console[level]=(...values)=>write(level,values);
    }

    const blob=new Blob([source.value],{type:'text/javascript'});
    const url=URL.createObjectURL(blob);
    try{
        await import(url);
        if(current === runNumber){
            write('success',['Module completed']);
        }
    }catch(err){
        write('error',[err]);
    }finally{
        URL.revokeObjectURL(url);
        for(const level of Object.keys(original)){
            console[level]=original[level];
        }
        if(current === runNumber){
            runButton.disabled=false;
            runButton.innerHTML='Run <kbd>⌘↵</kbd>';
        }
    }
};

source.value=defaultSource;
document.querySelector('#run').addEventListener('click',run);
document.querySelector('#reset').addEventListener('click',()=>{
    source.value=defaultSource;
    output.replaceChildren();
    source.focus();
});
document.querySelector('#clear').addEventListener('click',()=>output.replaceChildren());
document.querySelector('#copy').addEventListener('click',async event=>{
    const button=event.currentTarget;
    try{
        await navigator.clipboard.writeText(source.value);
        button.textContent='Copied';
        setTimeout(()=>{button.textContent='Copy';},1200);
    }catch(err){
        button.textContent='Copy failed';
    }
});

source.addEventListener('keydown',event=>{
    if(event.key === 'Tab'){
        event.preventDefault();
        const start=source.selectionStart;
        source.setRangeText('    ',start,source.selectionEnd,'end');
    }
    if(event.key === 'Enter' && (event.ctrlKey || event.metaKey)){
        event.preventDefault();
        run();
    }
});

globalThis.addEventListener('message',event=>{
    if(event.origin !== location.origin || !event.data || event.data.type !== 'strong-type:load'){
        return;
    }
    source.value=event.data.source;
    output.replaceChildren();
    source.focus();
});

if(location.protocol === 'file:'){
    write('warn',['Native module imports need HTTP. Run npm start, then open http://localhost:8000/.']);
}
