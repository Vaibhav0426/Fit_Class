const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authenticate = require("../authenticate");
const requireadmin = require("../requireadmin");
const nodemailer = require("nodemailer");
const Class = require("../models/Class");
const Booking=require("../models/Bookclass");
const Attendence=require("../models/Attendence");

/*
    @usage : to get all class
    @url : /api/class
    @fields : NULL 
    @method : GET
    @access : User
 */
// async function checkbooking(value,user){
//     let isbooked =await Booking.findOne({class_id:value._id,user_id:user.id})
//     let obj={}
//     obj.x={value};
//     if(!isbooked){value.isbooked=false}
//     else valueisbooked=true
//     return value;
// }
// function applyFunctionOnDict(dictionary, func,user) {
      
//   }
router.get("/",authenticate,async(req,res)=>{
    try{
      // console.log(req.body);
        let gymclass = await Class.find().populate("title", [
            "instructor",
            "description",
            "schedule",
            "capacity",
            "isbooked"
        ]);
        if(!gymclass){
            return response.status(400).json({ errors: [{ msg: "No class Found" }] });
        }
        let a=[];
        for (let i = 0; i < gymclass.length; i++) {
          let isbooked =await Booking.findOne({class_id:gymclass[i]._id,user_id:req.user.id})
          // console.log(isbooked);
          if(isbooked) a[i]="true";
          else a[i]="false";
        }
        res.status(200).json({class:gymclass,a:a,user: req.user});
    }catch(e){
        console.log(e);
        res.status(500).json({msg:"something went wrong"})
    }
})
router.get("/all",async(req,res)=>{
  try{
      let gymclass = await Class.find().populate("title", [
          "instructor",
          "description",
          "schedule",
          "capacity",
      ]);
      if(!gymclass){
          return response.status(400).json({ errors: [{ msg: "No class Found" }] });
      }
      
      res.status(200).json({class:gymclass,user: req.user});
  }catch(e){
      console.log(e);
      res.status(500).json({msg:"something went wrong"})
  }
})
/*
    @usage : to Enter a new class
    @url : /api/class/newclass
    @fields : title,instructor,description,schedule,capacity 
    @method : POST
    @access : Admin
 */

    router.post("/newclass", requireadmin, async (req, res) => {
        try {
          let { title,instructor,description,start,schedule,capacity } = req.body;
          let bookedspots=0;
          let gymclass = await Class.findOne({ schedule:schedule,instructor:instructor });
          if (gymclass) {
            return res.status(201).json({ msg: "Instructor is busy" });
          }

          gymclass = new Class({ title,instructor,description,start,schedule,capacity,bookedspots });
          await gymclass.save();
          res.status(200).json({ msg: "class scheduled successfully" });
        } catch (error) {
          console.log(error);
          res.status(500).json({ msg: "Something went wrong!" });
        }
      });

/*
    @usage : to get a specific class
    @url : /api/class/:classid
    @fields : NULL 
    @method : GET
    @access : User
 */
router.get("/:classid", authenticate, async (req, res) => {
    try {
      let classId = req.params.classid;
      let gymclass = await Class.findById(classId);
      if (!gymclass) {
        return response.status(400).json({ errors: [{ msg: "No class Found" }] });
      }
      res.status(200).json({ class: gymclass, user: req.user });
    } catch (e) {
      console.log(e);
    }
  });

  /*
    @usage : to delete a specific class
    @url : /api/class/:classid
    @fields : NULL 
    @method : delete
    @access : User
 */
    function sendEmail({ recipient_email, name ,schedule }) {
      console.log(recipient_email)
      return new Promise((resolve, reject) => {
        var transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.MY_EMAIL,
            pass: process.env.MY_PASSWORD,
          },
        });
    
        const mail_configs = {
          from: process.env.MY_EMAIL,
          to: recipient_email,
          subject: "Fit-class Class Deletion notifivation",
          html: `<!DOCTYPE html>
          <html lang="en" >
          <head>
            <meta charset="UTF-8">
            <title>Class Deleted</title>
            
          
          </head>
          <body>
          <!-- partial:index.partial.html -->
          <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0">
              <div style="border-bottom:1px solid #eee">
                <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Fit class</a>
              </div>
              <p style="font-size:1.1em">Hi,</p>
              <p>A class from schedules of Fit-Class has been Deleted.You Were a attendie of this class.We assure you Class had completed it's Task.If you think there is a mistake Contact Us</p>
              <p>Stay Tuned until New Schedule come up</p>
              <p>Here is details of class</p>
              <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;"><div>Name:${name}</div>Schedule:${schedule}</h2>
              <p style="font-size:0.9em;">Regards,<br />Fit-Class</p>
              <hr style="border:none;border-top:1px solid #eee" />
              <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                <p>Fit Class</p>
                
              </div>
            </div>
          </div>
          <!-- partial -->
            
          </body>
          </html>`,
        };
        transporter.sendMail(mail_configs, function (error, info) {
          if (error) {
            // console.log(error);
            return reject({ message: error });
          }
          return resolve({ message: "Email sent succesfuly" });
        });
      });
    }
router.delete("/:classid", requireadmin, async (req, res) => {
    try {
      let classId = req.params.classid;
      let gymclass = await Class.findById(classId);
      if (!gymclass) {
        return response.status(400).json({ errors: [{ msg: "No class Found" }] });
      }
      let booking=await Booking.find({class_id:classId}).populate("user_id");
      for(let i=0;i<booking.length;i++){
        let thisobj={recipient_email:booking[i].user_id.email,
          name:gymclass.title,
          schedule:gymclass.schedule,}
        console.log(booking[i].user_id.email);
        sendEmail(thisobj)
    .then((response) => console.log("done"))
    .catch((error) => console.log(error.message));
      }

      booking=await Booking.deleteMany({class_id:classId});
      let attedence=await Attendence.deleteMany({class_id:classId})
      gymclass=await Class.findByIdAndRemove(classId);
      res.status(200).json({msg:"class deleted", class: gymclass, user: req.user });
    } catch (e) {
      console.log(e);
    }
  });

   /*
    @usage : to update a class details
    @url : /api/class/:classid
    @fields : NULL 
    @method : delete
    @access : User
 */
router.put("/:classid", requireadmin, async (req, res) => {
  try {
    let classId = req.params.classid;
    let gymclass = await Class.findById(classId);
    if (!gymclass) {
      return response.status(201).json({ errors: [{ msg: "No class Found" }] });
    }

    let { title,instructor,description,schedule,capacity } = req.body;
    let ngymclass=await Class.findOne({instructor:instructor,schedule:schedule});

    if(ngymclass){
      return res.status(201).json({ msg: "instructor busy" });
    }
    let id=gymclass._id;
    let classobj={};
    classobj.title=title;
    classobj.instructor=instructor;
    classobj.description=description;
    classobj.schedule=schedule;
    classobj.capacity=capacity;

    gymclass=await Class.findByIdAndUpdate(id,{$set:classobj},{new:true});

    res.status(200).json({ msg: "class updated succesfully", class: gymclass });

  } catch (e) {
    console.log(e);
  }
});

module.exports=router;