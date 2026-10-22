import {setupState} from '@/lib/setup';
export const dynamic='force-dynamic';
export function GET(){return Response.json(setupState(),{headers:{'Cache-Control':'no-store'}});}
