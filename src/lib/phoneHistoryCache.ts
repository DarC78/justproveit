const cached=new Map<string,{value:unknown;expires:number}>();
const pending=new Map<string,Promise<unknown>>();
const ttl=15000,limit=200;
export function readPhoneHistoryCached<T>(token:string,key:string,load:()=>Promise<T>,fresh=false):Promise<T>{
 const scoped=`${token}:${key.toLowerCase()}`,entry=cached.get(scoped);
 if(!fresh&&entry&&entry.expires>Date.now())return Promise.resolve(entry.value as T);
 if(!fresh&&pending.has(scoped))return pending.get(scoped) as Promise<T>;
 const work=load().then(value=>{
  if(pending.get(scoped)===work){cached.delete(scoped);cached.set(scoped,{value,expires:Date.now()+ttl});while(cached.size>limit)cached.delete(cached.keys().next().value!);}
  return value;
 }).finally(()=>{if(pending.get(scoped)===work)pending.delete(scoped);});
 pending.set(scoped,work);return work;
}
export async function warmPhoneHistories(tasks:Array<()=>Promise<unknown>>,signal?:AbortSignal){
 let cursor=0;
 await Promise.all([0,1].map(async()=>{while(cursor<tasks.length&&!signal?.aborted){const task=tasks[cursor++];try{await task();}catch{/* An optional preload must not hide the lead list or its later read errors. */}}}));
}
