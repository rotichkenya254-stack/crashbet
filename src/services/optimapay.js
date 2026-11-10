const BASE=(process.env.OPTIMAPAY_BASE_URL||'https://global.optimapaybridge.co.ke').replace(/\/$/,'');
function guard(){
 if(process.env.PAYMENT_MODE!=='production')throw new Error('OptimaPay collection is in sandbox mode.');
 if(process.env.ENABLE_REAL_MONEY!=='true'||process.env.GAMBLING_LICENSE_CONFIRMED!=='true')throw new Error('Live transactions are locked until required regulatory and merchant approvals are confirmed.');
 if(!process.env.OPTIMAPAY_API_KEY||!process.env.OPTIMAPAY_API_SECRET)throw new Error('OptimaPay credentials are not configured.');
}
async function call(path,options={}){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{const r=await fetch(BASE+path,{...options,signal:controller.signal,headers:{'X-API-KEY':process.env.OPTIMAPAY_API_KEY,'X-API-SECRET':process.env.OPTIMAPAY_API_SECRET,'Accept':'application/json','Content-Type':'application/json',...(options.headers||{})}});
  const data=await r.json().catch(()=>({message:'Provider returned a non-JSON response.'}));return {ok:r.ok,statusCode:r.status,data};
 }finally{clearTimeout(timeout);}
}
async function collect({providerCode,phone,amount,reference}){guard();return call('/api/v2/godigital/tz/collect',{method:'POST',body:JSON.stringify({providerCode,phone,amount,reference})});}
async function status(identifier){guard();return call('/api/v2/godigital/tz/status/'+encodeURIComponent(identifier),{method:'GET'});}
module.exports={collect,status};
