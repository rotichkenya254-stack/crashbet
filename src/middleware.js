const jwt=require('jsonwebtoken');
const User=require('./models/User');
async function requireAuth(req,res,next){
 try{
  const header=req.headers.authorization||'';
  if(!header.startsWith('Bearer ')) return res.status(401).json({error:'Please log in.'});
  const claims=jwt.verify(header.slice(7),process.env.JWT_SECRET);
  const user=await User.findById(claims.sub).select('-passwordHash');
  if(!user||user.status!=='active') return res.status(401).json({error:'Account unavailable.'});
  req.user=user; next();
 }catch{return res.status(401).json({error:'Your session is invalid or has expired.'});}
}
function requireAdmin(req,res,next){if(req.user?.role!=='admin')return res.status(403).json({error:'Administrator access required.'});next();}
module.exports={requireAuth,requireAdmin};
