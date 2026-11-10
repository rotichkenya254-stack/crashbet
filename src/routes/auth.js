const router=require('express').Router();
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const User=require('../models/User');
const {requireAuth}=require('../middleware');
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function issue(u){return jwt.sign({sub:u._id.toString()},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'2h'});}
function publicUser(u){return {id:u._id,username:u.username,email:u.email,phone:u.phone,role:u.role,walletBalance:u.walletBalance,status:u.status};}
router.post('/register',async(req,res)=>{
 try{
  const {username,email,phone,password}=req.body||{};
  if(typeof username!=='string'||username.trim().length<3||username.trim().length>24)return res.status(400).json({error:'Username must be 3–24 characters.'});
  if(typeof email!=='string'||!emailPattern.test(email)||email.length>160)return res.status(400).json({error:'Enter a valid email address.'});
  if(typeof phone!=='string'||!/^255[67][0-9]{8}$/.test(phone))return res.status(400).json({error:'Use Tanzania phone format 255XXXXXXXXX.'});
  if(typeof password!=='string'||password.length<10||password.length>128)return res.status(400).json({error:'Password must be 10–128 characters.'});
  const normalizedEmail=email.trim().toLowerCase(),normalizedUsername=username.trim();
  if(await User.findOne({$or:[{email:normalizedEmail},{username:normalizedUsername}]}))return res.status(409).json({error:'Email or username already registered.'});
  const u=await User.create({username:normalizedUsername,email:normalizedEmail,phone,passwordHash:await bcrypt.hash(password,12)});
  res.status(201).json({token:issue(u),user:publicUser(u)});
 }catch(e){if(e.code===11000)return res.status(409).json({error:'Email or username already registered.'});res.status(500).json({error:'Registration failed. Please try again.'});}
});
router.post('/login',async(req,res)=>{
 try{const email=String(req.body?.email||'').trim().toLowerCase(),password=String(req.body?.password||'');const u=await User.findOne({email});
  if(!u||u.status!=='active'||!(await bcrypt.compare(password,u.passwordHash)))return res.status(401).json({error:'Incorrect login details.'});
  res.json({token:issue(u),user:publicUser(u)});
 }catch{return res.status(500).json({error:'Login failed. Please try again.'});}
});
router.get('/me',requireAuth,(req,res)=>res.json({user:publicUser(req.user)}));
module.exports=router;
