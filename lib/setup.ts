/** Configuration presence only. Never return secrets or their values. */
export function setupState(){
 const password=!!process.env.ADMIN_PASSWORD_HASH?.match(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
 const session=!!process.env.ADMIN_SESSION_SECRET&&process.env.ADMIN_SESSION_SECRET.length>=32;
 const repository=!!process.env.CONTENT_GITHUB_REPO?.match(/^[\w.-]+\/[\w.-]+$/);
 const token=!!process.env.CONTENT_GITHUB_TOKEN;
 return {authentication:password&&session,storage:repository&&token,checks:[
  {id:'password',label:'관리자 암호',ready:password},
  {id:'session',label:'보안 세션',ready:session},
  {id:'repository',label:'콘텐츠 저장소 연결',ready:repository},
  {id:'token',label:'콘텐츠 게시 권한',ready:token}
 ]};
}
