import {randomBytes,scryptSync} from 'node:crypto';
import {createInterface} from 'node:readline/promises';
// Terminal must be local and trusted; the password is never a CLI argument.
if(!process.stdin.isTTY)throw new Error('Run from your own interactive terminal.');
const rl=createInterface({input:process.stdin,output:process.stdout});
const password=await rl.question('새 관리자 암호 (20자 이상, 로컬 터미널에서만 입력): ');rl.close();
if(password.length<20)throw new Error('Use at least 20 characters.');const salt=randomBytes(16).toString('hex');
console.log('ADMIN_PASSWORD_HASH='+salt+':'+scryptSync(password,salt,64).toString('hex'));
console.log('ADMIN_SESSION_SECRET='+randomBytes(48).toString('base64url'));
