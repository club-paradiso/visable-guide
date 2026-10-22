import type {Answers,Content,Locale} from './schema';
export function workflow(content:Content,serviceId:string,answers:Answers){
 const service=content.services.find(s=>s.id===serviceId);
 if(!service)return [];
 return service.stepIds.map(id=>content.steps.find(s=>s.id===id)!).filter(s=>s.condition==='always'||answers[s.condition]);
}
export type Progress={schemaVersion:1;revision:number;locale:Locale;serviceId:string;answers:Answers;completed:string[];index:number;screen:'home'|'prepare'|'steps'|'done';savedAt:number};
export function restoreProgress(raw:string|null,content:Content):Progress|null{
 try{if(!raw)return null;const v=JSON.parse(raw);if(v.schemaVersion!==1||v.revision!==content.revision||Date.now()-v.savedAt>86400000||!['ko','en','zh','id','hi','vi'].includes(v.locale)||!content.services.some(s=>s.id===v.serviceId)||!['home','prepare','steps','done'].includes(v.screen)||!Number.isInteger(v.index)||v.index<0||typeof v.answers?.copy!=='boolean'||typeof v.answers?.stamp!=='boolean'||typeof v.answers?.card!=='boolean'||!Array.isArray(v.completed))return null;
 const steps=workflow(content,v.serviceId,v.answers); if(v.index>steps.length)return null;
 if(v.completed.some((id:unknown)=>typeof id!=='string'||!steps.some(s=>s.id===id)))return null;
 return {...v,completed:[...new Set(v.completed)]};}catch{return null;}
}
