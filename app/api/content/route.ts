import {NextResponse} from 'next/server';
import {readDocument,seed} from '@/lib/store';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{const {content}=await readDocument();return NextResponse.json({content,fallback:false},{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({content:seed,fallback:true},{headers:{'Cache-Control':'no-store'}});}}
