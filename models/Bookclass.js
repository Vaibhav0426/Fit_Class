const mongoose=require("mongoose");

const BookingSchema=new mongoose.Schema({
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

});
const Booking=mongoose.model("booking",BookingSchema);

module.exports=Booking;