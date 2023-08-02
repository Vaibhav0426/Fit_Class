const mongoose = require("mongoose");

const ClassSchema = new mongoose.Schema({
  title: {type: String,required: true, },
  instructor: {type: String,required: true,},
  description: {type: String,required: true,},
  start:{type:String,required:true},
  schedule: {type: String,required: true,},
  capacity: {type: Number,required: true,},
  bookedspots:{type:Number,required:true}
});

const Class=mongoose.model("class",ClassSchema);
module.exports=Class;
