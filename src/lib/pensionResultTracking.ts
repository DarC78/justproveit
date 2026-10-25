import {CLARITY_PROJECT_ID} from '@/lib/clarity';
type TrackedWindow=Window & {
  proveitPensionResultTracking?: boolean;
  proveitPensionAnalyticsTracking?: boolean;
  proveitAdvertising?: {revoke:()=>void};
  clarity?: ((...args:unknown[])=>void)&{q?:unknown[][]};
};
const path='/ro/rezultate-simulare/';
const choiceKey='proveit-advertising-consent-v1';
const tokenKey='proveit-pension-result-token';
export function preparePensionResultVisit():string|null {
  const w=window as TrackedWindow;
  w.proveitPensionResultTracking=false;
  w.proveitPensionAnalyticsTracking=false;
  const token=new URLSearchParams(w.location.hash.slice(1)).get('token');
  // Drop all URL parameters before any third-party SDK is allowed to load.
  w.history.replaceState({...w.history.state,as:path,url:path},'',path);
  if(token){try{sessionStorage.setItem(tokenKey,token);}catch{/* The email link still works. */}return token;}
  try{return sessionStorage.getItem(tokenKey);}catch{return null;}
}
export type PensionTrackingChoice={advertising:boolean;analytics:boolean};
export function startPensionResultTracking(choice:PensionTrackingChoice={advertising:true,analytics:true}):boolean {
  const w=window as TrackedWindow;
  if(w.location.pathname.replace(/\/$/,'')!==path.slice(0,-1)||w.location.search||w.location.hash)return false;
  if(!document.querySelector('main[data-clarity-mask="True"]'))return false;
  try{localStorage.setItem(choiceKey,JSON.stringify({value:choice.advertising?'granted':'denied',at:new Date().toISOString(),expires:Date.now()+180*86400000}));}catch{return false;}
  if(choice.advertising&&!w.proveitPensionResultTracking){
    w.proveitPensionResultTracking=true;
    const pixel=document.createElement('script');pixel.id='proveit-advertising-loader';pixel.async=true;pixel.src='/advertising-pixels.js?v=pension-result-1';
    document.head.appendChild(pixel);
  }
  if(choice.analytics&&!w.proveitPensionAnalyticsTracking){
    w.proveitPensionAnalyticsTracking=true;
    w.clarity=w.clarity||Object.assign((...args:unknown[])=>{(w.clarity!.q||=[]).push(args);},{q:[] as unknown[][]});
    w.clarity('consentv2',{ad_Storage:choice.advertising?'granted':'denied',analytics_Storage:'granted'});
    const clarity=document.createElement('script');clarity.id='microsoft-clarity';clarity.async=true;clarity.src='https://www.clarity.ms/tag/'+CLARITY_PROJECT_ID;
    document.head.appendChild(clarity);
  }
  return true;
}
export function stopPensionResultTracking(){
  const w=window as TrackedWindow;
  w.proveitPensionResultTracking=false;
  w.proveitPensionAnalyticsTracking=false;
  try{localStorage.setItem(choiceKey,JSON.stringify({value:'denied',at:new Date().toISOString(),expires:Date.now()+180*86400000}));}catch{/* No consent is assumed. */}
  w.proveitAdvertising?.revoke();
  w.clarity?.('consentv2',{ad_Storage:'denied',analytics_Storage:'denied'});
  for(const cookie of document.cookie.split(';')){
    const name=cookie.trim().split('=')[0];
    if(!/^(_clck|_clsk|_fbp|_fbc|_ttp|_tt_enable_cookie|ttcsid.*|_gcl_.*|_gac_.*)$/.test(name))continue;
    for(const domain of ['', '; Domain=justproveit.co.uk','; Domain=www.justproveit.co.uk'])document.cookie=name+'=; Max-Age=0; Path=/'+domain+'; SameSite=Lax; Secure';
  }
  w.location.reload();
}
