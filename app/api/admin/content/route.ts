import {NextResponse} from 'next/server';
import {adminActor,sameOrigin,adminState} from '@/lib/auth';
import {readDocument,saveContent,Conflict} from '@/lib/store';
import {saveSchema} from '@/lib/schema';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function GET(req:Request){if(!await adminActor(req))return NextResponse.json({error:'Unauthorized'},{status:401,headers});try{return NextResponse.json({...await readDocument(),state:adminState()},{headers});}catch{return NextResponse.json({error:'영구 저장소에 연결할 수 없습니다.'},{status:503,headers});}}
export async function PUT(req:Request){
 const actor=await adminActor(req);if(!actor)return NextResponse.json({error:'Unauthorized'},{status:401,headers});if(!sameOrigin(req))return NextResponse.json({error:'Origin rejected'},{status:403,headers});
 try{if(Number(req.headers.get('content-length'))>2500000)return NextResponse.json({error:'파일 크기를 줄여주세요.'},{status:413,headers});const raw=await req.text();if(raw.length>2500000)return NextResponse.json({error:'Too large'},{status:413,headers});const parsed=saveSchema.safeParse(JSON.parse(raw));if(!parsed.success)return NextResponse.json({error:'입력값을 확인하세요.',details:parsed.error.issues.map(i=>({path:i.path,message:i.message})).slice(0,10)},{status:400,headers});const {content,expectedRevision,reason}=parsed.data;return NextResponse.json(await saveContent(content,expectedRevision,actor,reason),{headers});}catch(e){if(e instanceof Conflict)return NextResponse.json({error:e.message},{status:409,headers});return NextResponse.json({error:'저장 실패. 연결·저장 용량·콘텐츠 구조를 확인하세요.'},{status:503,headers});}
}
