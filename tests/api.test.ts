import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scryptSync} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as session from '../app/api/admin/session/route';
import * as admin from '../app/api/admin/content/route';
import * as visitor from '../app/api/content/route';
import * as setup from '../app/api/admin/setup/route';
import {seed} from '../lib/store';
const base='http://localhost:4173';
function req(url:string,method='GET',body?:unknown,cookie?:string){return new Request(base+url,{method,headers:{host:'localhost:4173',origin:base,'Content-Type':'application/json',...(cookie?{cookie}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});}
test('real route handlers: anonymous rejection → login → save → public read → conflict → logout',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'vg-api-'));process.env.CONTENT_LOCAL_DIR=dir;const salt='a'.repeat(32);
 process.env.ADMIN_PASSWORD_HASH=salt+':'+scryptSync('test-only-api-password-1234',salt,64).toString('hex');process.env.ADMIN_SESSION_SECRET='test-only-api-session-secret-at-least-32-chars';
 try{
  assert.equal((await admin.GET(req('/api/admin/content'))).status,401);
  assert.equal((await admin.PUT(req('/api/admin/content','PUT',{}))).status,401);
  assert.equal((await session.POST(req('/api/admin/session','POST',null))).status,400);
  assert.equal((await session.POST(req('/api/admin/session','POST',{password:'wrong'}))).status,401);
  const login=await session.POST(req('/api/admin/session','POST',{password:'test-only-api-password-1234'}));assert.equal(login.status,200);
  const setCookie=login.headers.get('set-cookie')!;assert.match(setCookie,/HttpOnly/i);assert.match(setCookie,/SameSite=strict/i);const cookie=setCookie.split(';')[0];
  assert.equal((await(await session.GET(req('/api/admin/session','GET',undefined,cookie))).json()).authenticated,true);
  const input={content:structuredClone(seed),expectedRevision:1,reason:'API 통합 경로 검증'};input.content.notices[0].text.ko='현장 검수용 테스트 공지';
  const saved=await admin.PUT(req('/api/admin/content','PUT',input,cookie));assert.equal(saved.status,200);const d=await saved.json();assert.equal(d.content.revision,2);assert.equal(d.audit.length,1);
  const publicView=await(await visitor.GET()).json();assert.equal(publicView.content.notices[0].text.ko,'현장 검수용 테스트 공지');assert.equal(publicView.audit,undefined);
  assert.equal((await admin.PUT(req('/api/admin/content','PUT',input,cookie))).status,409);
  const csrf=new Request(base+'/api/admin/content',{method:'PUT',headers:{host:'localhost:4173',origin:'https://evil.example',cookie},body:JSON.stringify({...input,expectedRevision:2})});assert.equal((await admin.PUT(csrf)).status,403);
  const tampered={...input,content:{...input.content,ui:{}}};assert.equal((await admin.PUT(req('/api/admin/content','PUT',tampered,cookie))).status,400);
  const logout=await session.DELETE(req('/api/admin/session','DELETE',undefined,cookie));assert.match(logout.headers.get('set-cookie')!,/Max-Age=0/i);
  assert.equal((await session.GET(req('/api/admin/session'))).status,200);
 }finally{delete process.env.ADMIN_PASSWORD_HASH;delete process.env.ADMIN_SESSION_SECRET;delete process.env.CONTENT_LOCAL_DIR;await rm(dir,{recursive:true,force:true});}
});
test('setup endpoint returns only boolean checks, no credential values',async()=>{const state=await(await setup.GET()).json();assert.equal(state.authentication,false);assert.equal(state.storage,false);assert.equal(JSON.stringify(state).includes('ADMIN_SESSION_SECRET'),false);assert.equal(state.checks.length,4);});
