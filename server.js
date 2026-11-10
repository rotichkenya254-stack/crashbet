require('dotenv').config();
const express=require('express'),http=require('http'),mongoose=require('mongoose'),helmet=require('helmet'),cors=require('cors'),rateLimit=require('express-rate-limit');
const {Server}=require('socket.io');
const app=express(),server=http.createServer(app);
const allowedOrigin=process.env.APP_URL;
const io=new Server(server,{cors:{origin:allowedOrigin||false,methods:['GET']}});
app.disable('x-powered-by');app.set('trust proxy',1);
app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'","data:"],connectSrc:["'self'","ws:","wss:"],objectSrc:["'none'"],frameAncestors:["'none'"]}}}));
app.use(cors({origin:allowedOrigin||false,methods:['GET','POST'],allowedHeaders:['Content-Type','Authorization']}));
app.use(express.json({limit:'20kb'}));
app.use('/api/',rateLimit({windowMs:60000,limit:100,standardHeaders:true,legacyHeaders:false}));
app.use('/api/auth/login',rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:true,legacyHeaders:false}));
app.use('/api/auth/register',rateLimit({windowMs:60*60*1000,limit:10,standardHeaders:true,legacyHeaders:false}));
app.use(express.static('public',{dotfiles:'deny',etag:true,maxAge:process.env.NODE_ENV==='production'?'1h':0}));
app.get('/api/health',(_req,res)=>res.json({status:'ok',product:'CrashBet Tanzania',currency:'TZS',mode:'demo',realMoneyEnabled:false}));
app.use('/api/auth',require('./routes/auth'));app.use('/api/payments',require('./routes/payments'));app.use('/api/admin',require('./routes/admin'));
app.use((err,_req,res,_next)=>{if(err instanceof SyntaxError&&'body'in err)return res.status(400).json({error:'Invalid JSON request.'});console.error('Request error:',err.message);res.status(500).json({error:'An unexpected server error occurred.'});});
let round={id:1,state:'WAITING',multiplier:1};
function nextRound(){round={id:round.id+1,state:'WAITING',multiplier:1};io.emit('round:update',round);setTimeout(()=>{round.state='RUNNING';const start=Date.now();const timer=setInterval(()=>{const t=(Date.now()-start)/1000;round.multiplier=Number(Math.pow(1.055,t*5).toFixed(2));if(t>18){clearInterval(timer);round.state='CRASHED';io.emit('round:update',round);setTimeout(nextRound,4500);}else io.emit('round:update',round);},100);io.emit('round:update',round);},3500);}
io.on('connection',s=>s.emit('round:update',round));
async function start(){
 if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32)throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.');
 await mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/crashbet_tanzania');
 const port=Number(process.env.PORT)||3000;server.listen(port,()=>console.log(`CrashBet server ready on port ${port}`));nextRound();
}
start().catch(e=>{console.error('Startup failed:',e.message);process.exit(1);});
