import {coreMethods,nodeRows,validatorGroups} from './docs/reference.js';

const escapeHTML=function(value){
    return String(value).replace(/[&<>"']/g,character=>({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;'
    })[character]);
};

const statusClass=function(runtime){
    if(runtime === 'Shared'){
        return 'shared';
    }
    if(runtime === 'Node'){
        return 'node';
    }
    if(runtime.includes('Web')){
        return 'web';
    }
    return 'guarded';
};

const rowHTML=function(current,includeTry=true){
    const tryCell=includeTry ? `<td><button class="try-button" type="button" data-example="${escapeHTML(current.example)}">Try</button></td>` : '';
    return `<tr data-search="${escapeHTML(Object.values(current).join(' ').toLowerCase())}">
        <td><code>is.${escapeHTML(current.method)}(value)</code></td>
        <td>${escapeHTML(current.accepts)}</td>
        <td>${escapeHTML(current.edge)}</td>
        <td><span class="status ${statusClass(current.runtime)}">${escapeHTML(current.runtime)}</span></td>
        <td><code>${escapeHTML(current.example)}</code></td>
        ${tryCell}
    </tr>`;
};

const renderValidators=function(query=''){
    const target=document.querySelector('#validator-tables');
    const normalized=query.trim().toLowerCase();
    let visible=0;
    const groups=validatorGroups.map(group=>{
        const rows=group.rows.filter(current=>!normalized || Object.values(current).join(' ').toLowerCase().includes(normalized));
        visible+=rows.length;
        if(!rows.length){
            return '';
        }
        return `<section class="reference-group" id="${escapeHTML(group.id)}">
            <h3>${escapeHTML(group.title)}</h3>
            <p>${escapeHTML(group.description)}</p>
            <div class="table-wrap"><table>
                <caption>${rows.length} validator${rows.length === 1 ? '' : 's'}</caption>
                <thead><tr><th scope="col">Method</th><th scope="col">What passes</th><th scope="col">Important edge</th><th scope="col">Runtime</th><th scope="col">Example</th><th scope="col">Run</th></tr></thead>
                <tbody>${rows.map(current=>rowHTML(current)).join('')}</tbody>
            </table></div>
        </section>`;
    }).join('');

    target.innerHTML=groups || '<div class="callout warning">No validators match that filter.</div>';
    document.querySelector('#filter-status').textContent=`${visible} validator${visible === 1 ? '' : 's'} shown`;
};

const renderCore=function(){
    const rows=coreMethods.map(current=>`<tr><td><code>is.${escapeHTML(current.method)}</code></td><td>${escapeHTML(current.result)}</td><td>${escapeHTML(current.purpose)}</td></tr>`).join('');
    document.querySelector('#core-table').innerHTML=`<table><caption>Core and extension methods</caption><thead><tr><th scope="col">Method</th><th scope="col">Result</th><th scope="col">Purpose</th></tr></thead><tbody>${rows}</tbody></table>`;
};

const renderNode=function(){
    const rows=nodeRows.map(current=>rowHTML(current,false)).join('');
    document.querySelector('#node-table').innerHTML=`<table><caption>Node-only validators</caption><thead><tr><th scope="col">Method</th><th scope="col">What passes</th><th scope="col">Important edge</th><th scope="col">Runtime</th><th scope="col">Example</th></tr></thead><tbody>${rows}</tbody></table>`;
};

const copyText=async function(value,button){
    try{
        await navigator.clipboard.writeText(value);
        const previous=button.textContent;
        button.textContent='Copied';
        setTimeout(()=>{button.textContent=previous;},1200);
    }catch(err){
        button.textContent='Copy failed';
    }
};

const setupCopy=function(){
    document.addEventListener('click',event=>{
        const button=event.target.closest('[data-copy],[data-copy-target]');
        if(!button){
            return;
        }
        const direct=button.dataset.copy;
        const target=button.dataset.copyTarget && document.getElementById(button.dataset.copyTarget);
        copyText(direct || (target && target.textContent) || '',button);
    });
};

const setupExamples=function(){
    document.addEventListener('click',event=>{
        const button=event.target.closest('[data-example]');
        if(!button){
            return;
        }
        const source=`import Is from 'strong-type';\n\nconst is=new Is;\nconsole.log(${button.dataset.example});`;
        const frame=document.querySelector('#playground-frame');
        frame.contentWindow.postMessage({type:'strong-type:load',source},location.origin);
        document.querySelector('#playground').scrollIntoView({behavior:'smooth'});
    });
};

const setupNavigation=function(){
    const toggle=document.querySelector('.nav-toggle');
    const navigation=document.querySelector('#top-nav');
    toggle.addEventListener('click',()=>{
        const open=navigation.classList.toggle('open');
        toggle.setAttribute('aria-expanded',String(open));
    });
    navigation.addEventListener('click',()=>{
        navigation.classList.remove('open');
        toggle.setAttribute('aria-expanded','false');
    });

    if(!('IntersectionObserver' in globalThis)){
        return;
    }
    const links=new Map([...document.querySelectorAll('.side-nav a')].map(link=>[link.getAttribute('href').slice(1),link]));
    const observer=new IntersectionObserver(entries=>{
        for(const entry of entries){
            if(entry.isIntersecting && links.has(entry.target.id)){
                for(const link of links.values()){
                    link.classList.remove('active');
                }
                links.get(entry.target.id).classList.add('active');
            }
        }
    },{rootMargin:'-20% 0px -70% 0px'});
    for(const section of document.querySelectorAll('.doc-section')){
        observer.observe(section);
    }
};

renderValidators();
renderCore();
renderNode();
setupCopy();
setupExamples();
setupNavigation();

document.querySelector('#type-filter').addEventListener('input',event=>renderValidators(event.target.value));
