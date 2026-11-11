const test=require('node:test');const assert=require('node:assert/strict');const {backendUrl}=require('../api/shared/backendUrl');
test('backend forwarding requires explicit configuration and local staging loopback',()=>{
 const old={...process.env};try{
 delete process.env.JUSTPROVEIT_API_BASE_URL;assert.throws(()=>backendUrl('/route'),/required/);
 process.env.LocalStaging='true';process.env.JUSTPROVEIT_API_BASE_URL='https://example.com/api';assert.throws(()=>backendUrl('/route'),/loopback/);
 process.env.JUSTPROVEIT_API_BASE_URL='http://127.0.0.1:7072/api';assert.equal(backendUrl('/route'),'http://127.0.0.1:7072/api/route');
 }finally{process.env=old;}
});
