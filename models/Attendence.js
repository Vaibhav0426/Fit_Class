const mongoose=require("mongoose");

const AttendenceSchema=new mongoose.Schema({
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    class_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "class",
        required: true,
    },
    attended:{type:Boolean,required:true}
},{timestamps:true});
const Attendence=mongoose.model("attendence",AttendenceSchema);

module.exports=Attendence;