import {createServer} from 'node:http';
import {createReadStream,stat} from 'node:fs';
import {extname,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const port=Number(process.env.PORT) || 8000;
const types={
    '.css':'text/css; charset=utf-8',
    '.html':'text/html; charset=utf-8',
    '.ico':'image/x-icon',
    '.js':'text/javascript; charset=utf-8',
    '.json':'application/json; charset=utf-8',
    '.md':'text/markdown; charset=utf-8',
    '.png':'image/png',
    '.svg':'image/svg+xml; charset=utf-8'
};

const safePath=function(pathname){
    let decoded;
    try{
        decoded=decodeURIComponent(pathname);
    }catch(err){
        return false;
    }

    const target=resolve(root,`.${decoded}`);
    const normalizedRoot=`${root}${sep}`.toLowerCase();
    const normalizedTarget=target.toLowerCase();
    if(target !== root && !normalizedTarget.startsWith(normalizedRoot)){
        return false;
    }
    return target;
};

const send=function(response,status,body,type='text/plain; charset=utf-8'){
    response.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});
    response.end(body);
};

const serve=function(request,response){
    const url=new URL(request.url,'http://localhost');
    const target=safePath(url.pathname);
    if(!target){
        send(response,400,'Bad request');
        return;
    }

    stat(target,(error,details)=>{
        const file=!error && details.isDirectory() ? resolve(target,'index.html') : target;
        stat(file,(fileError,fileDetails)=>{
            if(fileError || !fileDetails.isFile()){
                send(response,404,'Not found');
                return;
            }
            response.writeHead(200,{
                'Content-Type':types[extname(file).toLowerCase()] || 'application/octet-stream',
                'Cache-Control':'no-store',
                'X-Content-Type-Options':'nosniff'
            });
            if(request.method === 'HEAD'){
                response.end();
                return;
            }
            createReadStream(file).pipe(response);
        });
    });
};

createServer(serve).listen(port,()=>{
    console.log(`strong-type docs: http://localhost:${port}/`);
});
