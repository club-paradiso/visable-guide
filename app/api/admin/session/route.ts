import {allowAttempt} from '@/lib/rate-limit';
import {NextResponse} from 'next/server';
import {authReady,passwordValid,signSession,cookieName,sameOrigin,adminActor} from '@/lib/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function GET(){const actor=await adminActor();return NextResponse.json({authenticated:!!actor,actor},{headers});}
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:'Origin rejected'},{status:403,headers});
 if(!authReady())return NextResponse.json({error:'관리자 인증이 설정되지 않았습니다. README의 환경변수 설정을 완료하세요.'},{status:503,headers});
 if(!allowAttempt(req))return NextResponse.json({error:'시도가 너무 많습니다. 15분 뒤 다시 시도하세요.'},{status:429,headers:{...headers,'Retry-After':'900'}});
 if(Number(req.headers.get('content-length'))>2048)return NextResponse.json({error:'Too large'},{status:413,headers});
 let body;try{body=await req.text();if(body.length>2048)throw new Error();body=JSON.parse(body);}catch{return NextResponse.json({error:'Invalid request'},{status:400,headers});}
 // scrypt provides a uniform cost for all attempted passwords. Configure durable edge rate limiting before public admin activation.
 if(typeof body.password!=='string'||!passwordValid(body.password))return NextResponse.json({error:'인증에 실패했습니다.'},{status:401,headers});
 const res=NextResponse.json({ok:true},{headers});res.cookies.set(cookieName,await signSession(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:7200});return res;
}
export async function DELETE(req:Request){if(!sameOrigin(req))return NextResponse.json({error:'Origin rejected'},{status:403});const res=NextResponse.json({ok:true},{headers});res.cookies.set(cookieName,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});return res;}
