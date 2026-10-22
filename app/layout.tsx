import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'VISABLE GUIDE | 비공식 시범 안내',description:'제주출입국 민원실 방문자를 위한 비공식 다국어 시범 안내. Unofficial multilingual pilot guide.',robots:{index:false,follow:false},appleWebApp:{capable:true,statusBarStyle:'default',title:'VISABLE GUIDE'},icons:{icon:'/icon-192.png',apple:'/icon-192.png'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#0a203d'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
