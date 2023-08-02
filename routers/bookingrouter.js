const express=require("express");
const router=express.Router();
const Attendence=require("../models/Attendence")
const Booking=require("../models/Bookclass");
const Class=require("../models/Class");
const User=require("../models/User");
const authenticate = require("../authenticate");


/*
    @usage : to check if preebooked
    @url : /api/booking/check
    @fields : classid
    @method : POST
    @access : admin
*/
router.get("/check", authenticate, async (req, res) => {
    try {
        let {classID}=req.body;
        let isbooked = await Booking.findOne({class_id:classID,user_id:req.user.id})
        console.log(isbooked)
        if(isbooked){
            return res.status(200).json({
                booked: true,
              });
        }
      else{
        return res.status(200).json({
            booked: false,
          });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ msg: "eror" });
    }
  });
/*
    @usage : to enter a booking detail
    @url : /api/booking/new/:classid
    @fields : leadid,date-time,type,content
    @method : POST
    @access : admin
*/
router.post("/new/:classid",authenticate,async(req,res)=>{
    try{
        let classId=req.params.classid;
        // console.log(classId)
        let gymclass = await Class.findById(classId);
          if (!gymclass) {
            return response.status(400).json({ errors: [{ msg: "No class Found" }] });
          }
        let isbooked=await Booking.findOne({class_id:classId,user_id:req.user.id});
        if(isbooked){return res.status(201).json({ msg: "already booked" });}
          if(gymclass.capacity==gymclass.bookedspots){
            return res.status(202).json({ msg: "No empty spot" });
          }
          let id=gymclass._id;
          let classobj={};
          classobj.bookedspots=gymclass.bookedspots+1;
          
      
          gymclass=await Class.findByIdAndUpdate(id,{$set:classobj},{new:true});
          let bookingobj={};
          bookingobj.class_id=classId;
          bookingobj.user_id=req.user.id;
          let booking=new Booking(bookingobj);
          await booking.save()
          res.status(200).json({ a:"a" });
    }catch(e){
        console.log(e);
        res.status(500).json({msg:e.message});
    }
});

  
      /*
      @usage : to cancel a booked class
      @url : /api/booking/book/:classid
      @fields : NULL 
      @method : delete
      @access : User
   */
      router.put("/cancelbook/:classid", authenticate, async (req, res) => {
        try {
          let classId = req.params.classid;
          let gymclass = await Class.findById(classId);
          if (!gymclass) {
            return response.status(400).json({ errors: [{ msg: "No class Found" }] });
          }

          if(gymclass.bookedspots==0){
            return response.status(202).json({ errors: [{ msg: "Class is not booked for user" }] });
          }
          let bookedclass=await Booking.findOne({class_id:classId,user_id:req.user.id})
          if(!bookedclass){
            return response.status(201).json({ errors: [{ msg: "class is not booked for this user" }] });
          }
          bookedclass=await Booking.findOneAndRemove({class_id:classId,user_id:req.user.id});
          let attendence=await Attendence.deleteMany({class_id:classId,user_id:req.user.id});
          let id=gymclass._id;
          let classobj={};
          classobj.bookedspots=gymclass.bookedspots-1;
          
      
          gymclass=await Class.findByIdAndUpdate(id,{$set:classobj},{new:true});
      
          res.status(200).json({ msg: "class canceled succesfully",class:gymclass});
      
        } catch (e) {
          console.log(e);
        }
      });


      module.exports=router;