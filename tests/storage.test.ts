import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readDocument,seed} from '../lib/store';
import {documentSchema} from '../lib/validation';
test('public repository content can be read without granting a write token',async()=>{const old=globalThis.fetch;process.env.CONTENT_GITHUB_REPO='test/test';globalThis.fetch=(async(url:RequestInfo|URL,init?:RequestInit)=>{assert.match(String(url),/^https:\/\/raw\.githubusercontent\.com\/test\/test\/content\/data\/published.json$/);assert.equal(new Headers(init?.headers).has('authorization'),false);return Response.json({content:seed,audit:[]});}) as typeof fetch;try{assert.equal((await readDocument()).content.revision,seed.revision);}finally{globalThis.fetch=old;delete process.env.CONTENT_GITHUB_REPO;}});
test('malformed audit envelope is rejected',()=>{assert.equal(documentSchema.safeParse({content:seed,audit:[{id:'fake',actor:'spoofed'}]}).success,false);assert.equal(documentSchema.safeParse({content:seed,audit:[]}).success,true);});
