import QRCode from 'qrcode';
import {mkdir,writeFile} from 'node:fs/promises';
import {seed} from '../lib/store';
const base=process.argv[2];if(!base)throw Error('Usage: node --import tsx scripts/generate-qr.ts https://verified-preview.vercel.app');const origin=new URL(base);if(origin.protocol!=='https:'&&origin.hostname!=='localhost')throw Error('HTTPS required');
const dir=process.argv[3]||'qr';await mkdir(dir,{recursive:true});
for(const id of ['entrance',...seed.facilities.map(f=>f.id)]){const url=new URL('/',origin);if(id!=='entrance')url.searchParams.set('facility',id);await writeFile(`${dir}/${id}.svg`,await QRCode.toString(url.toString(),{type:'svg',margin:4,width:512,errorCorrectionLevel:'M'}));await QRCode.toFile(`${dir}/${id}.png`,url.toString(),{width:1024,margin:4,errorCorrectionLevel:'M'});}
await writeFile(`${dir}/targets.json`,JSON.stringify({base:origin.origin,generatedAt:new Date().toISOString(),facilities:seed.facilities.map(f=>({id:f.id,name:f.name.ko,url:new URL('/?facility='+f.id,origin).toString()}))},null,2));
console.log('Generated 7 SVG + 7 PNG QR codes for '+origin.origin);
