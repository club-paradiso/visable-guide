// Accept the managed preview supervisor's generic Vite-style flags, then start Next.js.
import {spawn} from 'node:child_process';
const args=process.argv.slice(2);let port='4173',host='0.0.0.0';
for(let i=0;i<args.length;i++){if(args[i]==='--port')port=args[++i];if(args[i]==='--host'||args[i]==='--hostname')host=args[++i];}
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','--hostname',host,'--port',port],{stdio:'inherit',env:process.env});
process.on('SIGTERM',()=>child.kill('SIGTERM'));process.on('SIGINT',()=>child.kill('SIGINT'));child.on('exit',code=>process.exit(code??1));
