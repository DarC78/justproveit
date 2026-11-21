import {readdir,readFile,writeFile} from 'node:fs/promises';
const routes=[];
for(const name of await readdir('api')){
 let config;try{config=JSON.parse(await readFile(`api/${name}/function.json`,'utf8'));}catch(error){if(error.code==='ENOENT'||error.code==='ENOTDIR')continue;throw error;}
 const trigger=config.bindings.find(b=>b.type==='httpTrigger');
 const route=trigger?.route??name;
 if(!trigger||trigger.authLevel!=='anonymous'||typeof route!=='string'||!/^[a-z0-9/-]+$/.test(route))throw Error('Unexpected API hosting contract');
 routes.push(route);
}
if(routes.length!==12)throw Error('Review the changed API inventory before hosting');
const config=`# Generated from the twelve existing HTTP bindings.
root /srv/ls-frontends/justproveit/current;
index index.html;
absolute_redirect off;
server_tokens off;
autoindex off;
access_log off;
add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
add_header Cache-Control no-cache always;
location ^~ /.well-known/acme-challenge/ { root /var/lib/ls-frontends-acme; default_type text/plain; try_files $uri =404; }
location ~* ^/api/(?:${routes.sort().join('|')})/?$ {
 proxy_pass http://127.0.0.1:7077;
 proxy_http_version 1.1;
 proxy_set_header Host $host;
 proxy_set_header X-Forwarded-Host $host;
 proxy_set_header X-Forwarded-Proto https;
 proxy_set_header X-Forwarded-For $remote_addr;
 proxy_set_header Connection "";
 proxy_connect_timeout 10s;
 proxy_read_timeout 240s;
 proxy_cache off;
 client_max_body_size 100m;
 add_header Cache-Control no-store always;
 add_header Referrer-Policy no-referrer always;
}
location = /r {
 proxy_pass http://127.0.0.1:7077/api/email-link$is_args$args;
 proxy_set_header Host $host;
 proxy_set_header X-Forwarded-Host $host;
 proxy_set_header X-Forwarded-Proto https;
 add_header Cache-Control no-store always;
 add_header Referrer-Policy no-referrer always;
}
location = /bani-uk-ai-multumim {
 proxy_pass http://127.0.0.1:7077/api/bani-uk-ai-legacy-return$is_args$args;
 proxy_set_header Host $host;
 proxy_set_header X-Forwarded-Host $host;
 proxy_set_header X-Forwarded-Proto https;
 add_header Cache-Control no-store always;
 add_header Referrer-Policy no-referrer always;
}
location ~ ^/bani-uk-multumim { add_header X-Robots-Tag "noindex, nofollow" always; add_header Referrer-Policy no-referrer always; add_header Cache-Control no-store always; try_files $uri $uri.html $uri/ =404; }
location ~ ^/bani-uk-ai(?:/|$) { add_header Referrer-Policy no-referrer always; try_files $uri $uri.html $uri/ =404; }
location ~ ^/api/(?:family-memory/stripe-webhook|justproveit/stripe-crm/(?:proveit|justproveit)/webhook|webhooks/resend|social/facebook/oauth/callback|internal/tiktok/(?:connect|account/connect)|justproveit/admin/crm/email-oauth/callback)/?$ {
 proxy_pass http://127.0.0.1:7076;
 proxy_http_version 1.1;
 proxy_set_header Host $host;
 proxy_set_header X-Forwarded-Host $host;
 proxy_set_header X-Forwarded-Proto https;
 proxy_set_header X-Forwarded-For $remote_addr;
 proxy_set_header Connection "";
 proxy_connect_timeout 10s;
 proxy_read_timeout 240s;
 proxy_cache off;
 client_max_body_size 2m;
 add_header Cache-Control no-store always;
 add_header Referrer-Policy no-referrer always;
}
location ~ ^/(?:api/|admin/host|admin/functions) { return 404; }
location ~ /\\. { return 404; }
location ~* \\.(?:test\\.|env|pem$|key$) { return 404; }
error_page 404 /404.html;
location / { try_files $uri $uri.html $uri/ =404; }
`;
await writeFile('infrastructure/inhouse/locations.conf',config);
console.log(`Prepared ${routes.length} API routes and the existing public rewrites`);

