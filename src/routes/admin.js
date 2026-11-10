const router=require('express').Router();
const User=require('../models/User'),Payment=require('../models/Payment');
const {requireAuth,requireAdmin}=require('../middleware');
router.use(requireAuth,requireAdmin);
router.get('/overview',async(_req,res)=>{try{const [users,payments,pending,successful]=await Promise.all([User.countDocuments(),Payment.countDocuments(),Payment.countDocuments({status:'PENDING'}),Payment.aggregate([{$match:{status:'SUCCESSFUL'}},{$group:{_id:null,total:{$sum:'$amount'}}}])]);res.json({users,payments,pendingPayments:pending,successfulDepositsTzs:successful[0]?.total||0});}catch{return res.status(500).json({error:'Unable to load dashboard.'});}});
router.get('/users',async(req,res)=>{try{const page=Math.max(1,Number(req.query.page)||1),limit=25;const [items,total]=await Promise.all([User.find().select('username email phone role status walletBalance createdAt').sort({createdAt:-1}).skip((page-1)*limit).limit(limit),User.countDocuments()]);res.json({items,total,page,limit});}catch{return res.status(500).json({error:'Unable to load users.'});}});
router.get('/payments',async(req,res)=>{try{const page=Math.max(1,Number(req.query.page)||1),limit=25;const [items,total]=await Promise.all([Payment.find().select('userId providerCode phone amount clientReference status createdAt creditedAt').populate('userId','username email').sort({createdAt:-1}).skip((page-1)*limit).limit(limit),Payment.countDocuments()]);res.json({items,total,page,limit});}catch{return res.status(500).json({error:'Unable to load payments.'});}});
module.exports=router;
