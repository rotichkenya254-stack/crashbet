const router=require('express').Router(),crypto=require('crypto');
const Payment=require('../models/Payment'),User=require('../models/User'),api=require('../services/optimapay');
const {requireAuth}=require('../middleware');
const NETWORKS=['VODACOM','YAS','AIRTEL','HALOTEL'];
router.use(requireAuth);
router.post('/deposit',async(req,res)=>{
 let payment;
 try{
  const providerCode=String(req.body?.providerCode||'').toUpperCase(),phone=String(req.body?.phone||''),amount=Number(req.body?.amount);
  if(!NETWORKS.includes(providerCode))return res.status(400).json({error:'Choose a supported Tanzania mobile network.'});
  if(!/^255[67][0-9]{8}$/.test(phone))return res.status(400).json({error:'Use Tanzania phone format 255XXXXXXXXX.'});
  if(!Number.isSafeInteger(amount)||amount<500||amount>100000000)return res.status(400).json({error:'Deposit amount must be at least TZS 500.'});
  // A fresh reference is persisted before the provider call, preventing duplicate submissions from a client retry.
  const reference='CBTZ-'+Date.now()+'-'+crypto.randomBytes(6).toString('hex').toUpperCase();
  payment=await Payment.create({userId:req.user._id,providerCode,phone,amount,clientReference:reference});
  const out=await api.collect({providerCode,phone,amount,reference});
  const d=out.data?.data||out.data||{};payment.providerReference=d.reference?String(d.reference):null;payment.providerTransactionId=d.transaction_id?String(d.transaction_id):null;
  payment.rawStatus={httpStatus:out.statusCode,response:out.data};
  const state=String(d.status||'').toUpperCase();if(['FAILED','CANCELLED'].includes(state))payment.status=state;
  await payment.save();
  if(!out.ok)return res.status(502).json({error:'The payment provider did not accept the request. Check transaction status before trying again.',reference});
  return res.status(202).json({message:'Payment request submitted. Await the mobile-money prompt and check the final status.',reference,status:payment.status});
 }catch(e){if(payment){payment.rawStatus={error:'provider_request_error'};await payment.save().catch(()=>{});return res.status(503).json({error:'Payment request could not be completed. Check the transaction status before retrying.',reference:payment.clientReference});}return res.status(500).json({error:'Unable to create payment request.'});}
});
router.get('/status/:reference',async(req,res)=>{
 try{
  const p=await Payment.findOne({clientReference:req.params.reference,userId:req.user._id});if(!p)return res.status(404).json({error:'Transaction not found.'});
  if(p.status==='PENDING'&&(p.providerReference||p.providerTransactionId)){
   try{const out=await api.status(p.providerReference||p.providerTransactionId),d=out.data?.data||out.data||{},s=String(d.status||'').toUpperCase();
    if(out.ok&&['SUCCESSFUL','FAILED','CANCELLED'].includes(s)){
     // Claim terminal transition and successful credit marker in one atomic update.
     const update={$set:{status:s,rawStatus:out.data}};
     if(s==='SUCCESSFUL')update.$set.creditedAt=new Date();
     const claimed=await Payment.findOneAndUpdate({_id:p._id,status:'PENDING',creditedAt:null},update,{new:true});
     if(claimed&&s==='SUCCESSFUL')await User.updateOne({_id:p.userId},{$inc:{walletBalance:p.amount}});
    }
   }catch{/* Keep pending when provider status is temporarily unavailable. */}
  }
  const fresh=await Payment.findById(p._id).select('amount status clientReference createdAt creditedAt');return res.json({payment:fresh});
 }catch{return res.status(500).json({error:'Unable to retrieve transaction status.'});}
});
// No unauthenticated crediting: provider callback signature/verification must be confirmed before enabling a webhook.
router.post('/webhook',(_req,res)=>res.status(501).json({received:false,message:'Provider callback verification is not configured. Use authenticated status checks.'}));
module.exports=router;
