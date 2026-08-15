import {coreMethods,nodeRows,validatorGroups} from './docs/reference.js';

const playgroundKey='strong-type:playground-source';

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
    const status=document.querySelector('#filter-status');
    if(!target || !status){
        return;
    }

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
    status.textContent=`${visible} validator${visible === 1 ? '' : 's'} shown`;
};

const renderCore=function(){
    const target=document.querySelector('#core-table');
    if(!target){
        return;
    }

    const rows=coreMethods.map(current=>`<tr><td><code>is.${escapeHTML(current.method)}</code></td><td>${escapeHTML(current.result)}</td><td>${escapeHTML(current.purpose)}</td></tr>`).join('');
    target.innerHTML=`<table><caption>Core and extension methods</caption><thead><tr><th scope="col">Method</th><th scope="col">Result</th><th scope="col">Purpose</th></tr></thead><tbody>${rows}</tbody></table>`;
};

const renderNode=function(){
    const target=document.querySelector('#node-table');
    if(!target){
        return;
    }

    const rows=nodeRows.map(current=>rowHTML(current,false)).join('');
    target.innerHTML=`<table><caption>Node-only validators</caption><thead><tr><th scope="col">Method</th><th scope="col">What passes</th><th scope="col">Important edge</th><th scope="col">Runtime</th><th scope="col">Example</th></tr></thead><tbody>${rows}</tbody></table>`;
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

const storePlaygroundSource=function(source){
    try{
        sessionStorage.setItem(playgroundKey,source);
    }catch(err){
        return false;
    }
    return true;
};

const postPlaygroundSource=function(frame,source){
    frame.contentWindow.postMessage({type:'strong-type:load',source},location.origin);
};

const openPlayground=function(source){
    const frame=document.querySelector('#playground-frame');
    if(frame){
        if(frame.dataset.ready === 'true'){
            postPlaygroundSource(frame,source);
        }else{
            frame.addEventListener('load',()=>postPlaygroundSource(frame,source),{once:true});
        }
        frame.focus();
        return;
    }

    storePlaygroundSource(source);
    location.href='./playground.html';
};

const setupExamples=function(){
    document.addEventListener('click',event=>{
        const exampleButton=event.target.closest('[data-example]');
        if(exampleButton){
            const source=`import Is from 'strong-type';\n\nconst is=new Is;\nconsole.log(${exampleButton.dataset.example});`;
            openPlayground(source);
            return;
        }

        const loadButton=event.target.closest('[data-load-target]');
        if(!loadButton){
            return;
        }
        const target=document.getElementById(loadButton.dataset.loadTarget);
        if(target){
            openPlayground(target.textContent);
        }
    });
};

const setupPlayground=function(){
    const frame=document.querySelector('#playground-frame');
    if(!frame){
        return;
    }

    const ready=function(){
        frame.dataset.ready='true';
    };
    frame.addEventListener('load',ready,{once:true});

    let source;
    try{
        source=sessionStorage.getItem(playgroundKey);
        sessionStorage.removeItem(playgroundKey);
    }catch(err){
        source=false;
    }
    if(!source){
        return;
    }

    frame.addEventListener('load',()=>postPlaygroundSource(frame,source),{once:true});

    try{
        if(frame.contentDocument && frame.contentDocument.readyState === 'complete'){
            ready();
            postPlaygroundSource(frame,source);
        }
    }catch(err){
        return;
    }
};

const setupNavigation=function(){
    const toggle=document.querySelector('.nav-toggle');
    const navigation=document.querySelector('#top-nav');
    if(!toggle || !navigation){
        return;
    }

    toggle.addEventListener('click',()=>{
        const open=navigation.classList.toggle('open');
        toggle.setAttribute('aria-expanded',String(open));
    });
    navigation.addEventListener('click',()=>{
        navigation.classList.remove('open');
        toggle.setAttribute('aria-expanded','false');
    });
};

renderValidators();
renderCore();
renderNode();
setupCopy();
setupExamples();
setupPlayground();
setupNavigation();

const filter=document.querySelector('#type-filter');
if(filter){
    filter.addEventListener('input',event=>renderValidators(event.target.value));
}
