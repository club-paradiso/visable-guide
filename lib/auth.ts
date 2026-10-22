import {scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import {SignJWT,jwtVerify} from 'jose';
import {writable} from './store';
export const cookieName='vg_admin';
export function authReady(){return !!process.env.ADMIN_PASSWORD_HASH?.match(/^[0-9a-f]{32}:[0-9a-f]{128}$/)&&!!process.env.ADMIN_SESSION_SECRET&&process.env.ADMIN_SESSION_SECRET.length>=32;}
export function passwordValid(password:string){if(!authReady()||password.length>256)return false;try{const [salt,hash]=process.env.ADMIN_PASSWORD_HASH!.split(':');return timingSafeEqual(scryptSync(password,salt,64),Buffer.from(hash,'hex'));}catch{return false;}}
function key(){return new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET);}
function version(){return createHash('sha256').update(process.env.ADMIN_PASSWORD_HASH||'').digest('hex');}
export async function signSession(){return new SignJWT({role:'admin',version:version()}).setProtectedHeader({alg:'HS256'}).setIssuer('visable-guide').setAudience('admin').setSubject(process.env.ADMIN_USERNAME||'operator').setIssuedAt().setExpirationTime('2h').sign(key());}
export async function verifySession(token:string){if(!authReady())return null;try{const {payload}=await jwtVerify(token,key(),{issuer:'visable-guide',audience:'admin',algorithms:['HS256']});return payload.role==='admin'&&payload.version===version()&&typeof payload.sub==='string'?payload.sub:null;}catch{return null;}}
export async function adminActor(req:Request){const token=req.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1);return token?verifySession(token):null;}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');const host=req.headers.get('host');if(!origin||!host)return false;try{return new URL(origin).host===host&&['http:','https:'].includes(new URL(origin).protocol);}catch{return false;}}
export function adminState(){return {authentication:authReady(),storage:writable(),backend:process.env.CONTENT_GITHUB_TOKEN?'github':process.env.CONTENT_GITHUB_REPO?'github-readonly':'local'};}
