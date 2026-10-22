import {mkdir,readFile,writeFile,rename,open,unlink} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import seedData from '../data/seed.json';
import {contentSchema,type Content} from './schema';
import {documentSchema} from './validation';
export const seed=seedData as Content;
export type Audit={id:string;at:string;actor:string;reason:string;revision:number;hash:string;previousHash:string;changed:string[]};
type Document={content:Content;audit:Audit[]};
const localDir=()=>path.resolve(process.env.CONTENT_LOCAL_DIR||'runtime');
const githubReady=()=>!!process.env.CONTENT_GITHUB_TOKEN&&!!process.env.CONTENT_GITHUB_REPO;
const remoteSource=()=>!!process.env.CONTENT_GITHUB_REPO;
export function writable(){return githubReady()||(!process.env.VERCEL&&process.env.NODE_ENV!=='production')||(!process.env.VERCEL&&!!process.env.CONTENT_LOCAL_DIR);}
function githubUrl(){const repo=process.env.CONTENT_GITHUB_REPO!;if(!/^[\w.-]+\/[\w.-]+$/.test(repo))throw new Error('Invalid repository');const p=process.env.CONTENT_GITHUB_PATH||'data/published.json';if(!/^[a-zA-Z0-9_./-]+$/.test(p)||p.includes('..'))throw new Error('Invalid content path');return `https://api.github.com/repos/${repo}/contents/${p}`;}
async function ghRead():Promise<{document:Document;sha?:string}>{
 const branch=process.env.CONTENT_GITHUB_BRANCH||'content';
 const res=await fetch(githubUrl()+`?ref=${encodeURIComponent(branch)}`,{headers:{Authorization:`Bearer ${process.env.CONTENT_GITHUB_TOKEN}`,Accept:'application/vnd.github.object+json','X-GitHub-Api-Version':'2022-11-28'},cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(res.status===404)return {document:{content:seed,audit:[]}};
 if(!res.ok)throw new Error('Content storage unavailable');
 const data=await res.json();let encoded=data.content;
 // GitHub Contents omits base64 content above 1 MB; use the Git blob endpoint.
 if(data.encoding==='none'||!encoded){if(!/^[a-f0-9]{40,64}$/.test(data.sha||''))throw new Error('Invalid storage revision');const blob=await fetch(`https://api.github.com/repos/${process.env.CONTENT_GITHUB_REPO}/git/blobs/${data.sha}`,{headers:{Authorization:`Bearer ${process.env.CONTENT_GITHUB_TOKEN}`,Accept:'application/vnd.github+json'},cache:'no-store',signal:AbortSignal.timeout(12000)});if(!blob.ok)throw new Error('Content blob unavailable');encoded=(await blob.json()).content;}
 const doc=documentSchema.parse(JSON.parse(Buffer.from(encoded,'base64').toString()));return {document:doc,sha:data.sha};
}
async function localRead():Promise<Document>{try{const d=JSON.parse(await readFile(path.join(localDir(),'published.json'),'utf8'));return documentSchema.parse(d);}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {content:seed,audit:[]};throw e;}}
async function publicRead():Promise<Document>{
 const repo=process.env.CONTENT_GITHUB_REPO!;githubUrl();
 const branch=process.env.CONTENT_GITHUB_BRANCH||'content';
 const file=process.env.CONTENT_GITHUB_PATH||'data/published.json';
 const res=await fetch(`https://raw.githubusercontent.com/${repo}/${encodeURIComponent(branch)}/${file}`,{cache:'no-store',signal:AbortSignal.timeout(7000)});
 if(!res.ok)throw new Error('Public content unavailable');
 return documentSchema.parse(await res.json());
}
export async function readDocument():Promise<Document>{return githubReady()?(await ghRead()).document:remoteSource()?publicRead():localRead();}
let localQueue=Promise.resolve();
async function withLock<T>(fn:()=>Promise<T>):Promise<T>{
 let release!:()=>void;const previous=localQueue;localQueue=new Promise<void>(r=>{release=r});await previous;
 const lock=path.join(localDir(),'.lock');let handle;
 try{await mkdir(localDir(),{recursive:true});handle=await open(lock,'wx');return await fn();}finally{try{if(handle){await handle.close();await unlink(lock);}}finally{release();}}
}
export class Conflict extends Error{}
export async function saveContent(next:Content,expected:number,actor:string,reason:string){
 if(!writable())throw new Error('Durable storage must be configured');
 const perform=async()=>{
 const loaded=githubReady()?await ghRead():{document:await localRead(),sha:undefined};
 const old=loaded.document;if(old.content.revision!==expected)throw new Conflict('Content changed. Reload before saving.');
 const content=contentSchema.parse({...next,revision:expected+1,updatedAt:new Date().toISOString()});
 // Keys cannot disappear: clients rely on these accessibility/safety strings.
 for(const k of Object.keys(seed.ui))if(!content.ui[k])throw new Error(`Missing UI key: ${k}`);
 const changed=Object.keys(content).filter(k=>JSON.stringify(content[k as keyof Content])!==JSON.stringify(old.content[k as keyof Content]));
 const event:Audit={id:crypto.randomUUID(),at:content.updatedAt,actor,reason,revision:content.revision,previousHash:old.audit.at(-1)?.hash||'',hash:'',changed};
 event.hash=createHash('sha256').update(JSON.stringify({...event,hash:undefined})+JSON.stringify(content)).digest('hex');
 const document={content,audit:[...old.audit,event]};
 const serialized=JSON.stringify(document,null,2)+'\n';if(Buffer.byteLength(serialized)>2400000)throw new Error('Content too large; use smaller photos.');
 if(githubReady()){
 const res=await fetch(githubUrl(),{method:'PUT',headers:{Authorization:`Bearer ${process.env.CONTENT_GITHUB_TOKEN}`,'Content-Type':'application/json',Accept:'application/vnd.github+json'},body:JSON.stringify({message:`content(r${content.revision}): ${reason}`,content:Buffer.from(serialized).toString('base64'),branch:process.env.CONTENT_GITHUB_BRANCH||'content',...(loaded.sha?{sha:loaded.sha}:{})}),signal:AbortSignal.timeout(15000)});
 if(res.status===409||res.status===422)throw new Conflict('Storage conflict. Reload before saving.');if(!res.ok)throw new Error('Content write failed');
 }else{const file=path.join(localDir(),'published.json');const temp=file+`.${crypto.randomUUID()}.tmp`;await writeFile(temp,serialized,{mode:0o600});await rename(temp,file);}
 return document;
 };
 return githubReady()?perform():withLock(perform);
}
