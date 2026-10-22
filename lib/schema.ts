import {z} from 'zod';
export const locales=['ko','en','zh','id','hi','vi'] as const;
export type Locale=typeof locales[number];
export const localized=z.object({ko:z.string().min(1).max(4000),en:z.string().min(1).max(4000),zh:z.string().min(1).max(4000),id:z.string().min(1).max(4000),hi:z.string().min(1).max(4000),vi:z.string().min(1).max(4000)}).strict();
export type Text=z.infer<typeof localized>;
const id=z.string().regex(/^[a-z][a-z0-9-]{0,47}$/);
export const review=z.enum(['pending','reviewed']);
const image=z.string().max(800000).refine(v=>!v || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(v),'PNG, JPEG or WebP data URL required').refine(v=>{
 if(!v)return true;
 let bytes:Uint8Array;try{const raw=v.split(',')[1];bytes=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));}catch{return false;}
 return v.startsWith('data:image/png')?[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n):v.startsWith('data:image/jpeg')?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
},'Invalid image signature');
const condition=z.enum(['always','copy','stamp','card']);
export const contentSchema=z.object({
 schemaVersion:z.literal(1),revision:z.number().int().min(1),updatedAt:z.string().datetime(),
 notices:z.array(z.object({id,text:localized,active:z.boolean(),review})).max(20),
 services:z.array(z.object({id,title:localized,description:localized,review,preparation:localized,stepIds:z.array(id).min(1).max(20)})).min(1).max(30),
 steps:z.array(z.object({id,title:localized,body:localized,warning:localized,preparation:localized,facilityId:id,condition,review,fee:localized})).min(1).max(40),
 facilities:z.array(z.object({id,name:localized,description:localized,location:localized,locationReview:review,photo:image,routeImage:image,routeReview:review})).min(1).max(30),
 floorplan:z.object({image,review,description:localized}),
 formFields:z.array(z.object({id,title:localized,help:localized,example:localized,mistake:localized,review})).min(1).max(40),
 ui:z.record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/),localized),
 sources:z.array(z.object({id,title:z.string().max(200),url:z.url().refine(v=>new URL(v).protocol==='https:'),checkedAt:z.string().datetime(),scope:z.string().max(2000)})).max(20)
}).strict().superRefine((v,c)=>{
 for(const key of ['services','steps','facilities','formFields','notices','sources'] as const){if(new Set(v[key].map(x=>x.id)).size!==v[key].length)c.addIssue({code:'custom',message:`Duplicate ${key} IDs`});}
 for(const s of v.services){if(new Set(s.stepIds).size!==s.stepIds.length)c.addIssue({code:'custom',message:'Duplicate workflow steps'});for(const sid of s.stepIds)if(!v.steps.some(x=>x.id===sid))c.addIssue({code:'custom',message:`Unknown step ${sid}`});}
 for(const s of v.steps)if(!v.facilities.some(f=>f.id===s.facilityId))c.addIssue({code:'custom',message:`Unknown facility ${s.facilityId}`});
 if(!v.steps.some(s=>s.id==='confirm'&&s.condition==='always'))c.addIssue({code:'custom',message:'An always-on confirmation step is required'});
 for(const s of v.services)if(s.stepIds[0]!=='confirm')c.addIssue({code:'custom',message:'Every workflow must start with staff confirmation'});
});
export type Content=z.infer<typeof contentSchema>;
export type Answers={copy:boolean;stamp:boolean;card:boolean};
export const saveSchema=z.object({expectedRevision:z.number().int(),reason:z.string().trim().min(5).max(300),content:contentSchema}).strict();
export function textAt(t:Text,locale:Locale){return t[locale];}
