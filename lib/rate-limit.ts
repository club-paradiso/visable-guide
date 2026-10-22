import {createHash} from 'node:crypto';
// Bounded, instance-local abuse protection. No raw IP storage. Not a distributed limiter.
const attempts=new Map<string,{count:number;expires:number}>();
export function allowAttempt(req:Request,now=Date.now()){
 const key=createHash('sha256').update((req.headers.get('x-forwarded-for')||'local').split(',')[0]).digest('hex');
 for(const [k,v]of attempts)if(v.expires<=now)attempts.delete(k);
 if(attempts.size>2000)attempts.delete(attempts.keys().next().value!);
 const current=attempts.get(key);if(current&&current.count>=8)return false;
 attempts.set(key,{count:(current?.count||0)+1,expires:current?.expires||now+900000});return true;
}
