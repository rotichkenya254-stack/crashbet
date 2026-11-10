const mongoose = require('mongoose');
module.exports = mongoose.model('User', new mongoose.Schema({
 username:{type:String,required:true,trim:true,minlength:3,unique:true},
 email:{type:String,required:true,lowercase:true,trim:true,unique:true},
 phone:{type:String,required:true,match:/^255[67][0-9]{8}$/},
 passwordHash:{type:String,required:true},
 role:{type:String,enum:['player','admin'],default:'player'},
 walletBalance:{type:Number,default:0,min:0},
 status:{type:String,enum:['active','suspended'],default:'active'}
},{timestamps:true}));
