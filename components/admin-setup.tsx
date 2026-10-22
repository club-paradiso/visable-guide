'use client';
import {useEffect,useState} from 'react';
type Setup={authentication:boolean;storage:boolean;checks:{id:string;label:string;ready:boolean}[]};
export default function AdminSetup(){const [setup,setSetup]=useState<Setup|null>(null);const [error,setError]=useState(false);
 useEffect(()=>{fetch('/api/admin/setup',{cache:'no-store',signal:AbortSignal.timeout(8000)}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(setSetup).catch(()=>setError(true));},[]);
 return <section className="setup-status" aria-label="관리자 설정 상태"><h2>관리자 설정 상태</h2>{error?<p role="status">설정 상태를 불러오지 못했습니다.</p>:!setup?<p role="status">설정 확인 중…</p>:<><ul>{setup.checks.map(check=><li key={check.id}><span aria-hidden>{check.ready?'✓':'○'}</span><span>{check.label}</span><strong>{check.ready?'준비됨':'설정 필요'}</strong></li>)}</ul><p className="caption">{setup.authentication?setup.storage?'로그인 후 콘텐츠를 편집하고 게시할 수 있습니다.':'로그인은 가능합니다. 게시 권한 설정 전까지는 초안 다운로드를 이용하세요.':'기본 암호는 없습니다. 저장소 README의 관리자 설정 절차를 완료하세요.'}</p></>}</section>;
}
