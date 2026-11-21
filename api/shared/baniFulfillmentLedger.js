const http=require('node:http'),https=require('node:https');
const PARTITION='FondatoriBaniUkAi';
function createPostgresLedgerClient({baseUrl,key,connectIp,timeoutMs=10000}){
 if(!baseUrl||typeof key!=='string'||key.length<32)throw Error('PostgreSQL fulfillment configuration unavailable');
 const endpoint=new URL(baseUrl);
 if(endpoint.username||endpoint.password||endpoint.search||endpoint.hash||!['http:','https:'].includes(endpoint.protocol)||(endpoint.protocol==='http:'&&!['127.0.0.1','localhost'].includes(endpoint.hostname)))throw Error('Invalid fulfillment service origin');
 if(connectIp&&!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(connectIp))throw Error('Invalid fulfillment connection address');
 endpoint.pathname=endpoint.pathname.replace(/\/$/,'')+'/justproveit/internal/bani-fulfillment-ledger';
 const operation=body=>new Promise((resolve,reject)=>{
  const data=Buffer.from(JSON.stringify(body)),transport=endpoint.protocol==='https:'?https:http;
  const req=transport.request({protocol:endpoint.protocol,hostname:connectIp||endpoint.hostname,port:endpoint.port||undefined,servername:endpoint.hostname,path:endpoint.pathname,method:'POST',headers:{Host:endpoint.host,'Content-Type':'application/json','Content-Length':data.length,'x-bani-ledger-key':key},timeout:timeoutMs},res=>{
   const chunks=[];let size=0;
   res.on('data',part=>{size+=part.length;if(size>65536)req.destroy(Error('Fulfillment response too large'));else chunks.push(part);});
   res.on('end',()=>{try {const result=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(res.statusCode<200||res.statusCode>=300)throw Object.assign(Error('Fulfillment ledger request rejected'),{statusCode:res.statusCode});if(!result.entity)throw Error('Invalid fulfillment ledger response');resolve(result.entity);}catch(e){reject(e);}});
   res.on('error',reject);
  });
  req.on('timeout',()=>req.destroy(Error('Fulfillment ledger timeout')));req.on('error',reject);req.end(data);
 });
 const scoped=(partition)=>{if(partition!==PARTITION)throw Error('Invalid fulfillment partition');};
 return {
  async createTable(){},
  async getEntity(partition,id){scoped(partition);return operation({operation:'get',id});},
  async createEntity(entity){scoped(entity.partitionKey);return operation({operation:'create',entity});},
  async updateEntity(entity,mode,options={}){scoped(entity.partitionKey);if(mode!=='Merge')throw Error('Only fulfillment merge is supported');return operation({operation:'merge',entity,...(options.etag?{etag:options.etag}:{})});}
 };
}
module.exports={createPostgresLedgerClient};
