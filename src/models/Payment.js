const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
 providerCode:{type:String,enum:['VODACOM','YAS','AIRTEL','HALOTEL'],required:true},
 phone:{type:String,required:true},amount:{type:Number,required:true,min:500},
 clientReference:{type:String,required:true,unique:true,index:true},providerReference:{type:String,index:true},providerTransactionId:{type:String,index:true},
 status:{type:String,enum:['PENDING','SUCCESSFUL','FAILED','CANCELLED'],default:'PENDING',index:true},creditedAt:Date,rawStatus:mongoose.Schema.Types.Mixed
},{timestamps:true});
module.exports=mongoose.models.Payment||mongoose.model('Payment',schema);
