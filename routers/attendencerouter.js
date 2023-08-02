const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authenticate = require("../authenticate");
const requireadmin = require("../requireadmin");
const Attendence = require("../models/Attendence");
const Class = require("../models/Class");
const Booking = require("../models/Bookclass");
const { default: mongoose } = require("mongoose");

function check(given) {
  const currentTime = new Date();
  for (let i = 0; i < given.length; i++) {
    const givenTimeObj = new Date(given[i].createdAt);

    // console.log(given[i]);
    // console.log("---------------------------------------------------");

    const timeDifference = Math.abs(
      currentTime.getTime() - givenTimeObj.getTime()
    );

    const timeDifferenceInMinutes = timeDifference / (1000 * 60);

    if (timeDifferenceInMinutes <= 10) return true;
  }
  return false;
}
function is10minute(givenTime) {
  const currentTime = new Date();
  let a = givenTime;
let [hours, minutes] = a.split(":"); 
let givenTimeObj = new Date(); 
givenTimeObj.setHours(parseInt(hours, 10)); 
givenTimeObj.setMinutes(parseInt(minutes, 10)); 

  const timeDifference = Math.abs(
    currentTime.getTime() - givenTimeObj.getTime()
  );
  const timeDifferenceInMinutes = timeDifference / (1000 * 60);
  // console.log(timeDifferenceInMinutes < 10);
  console.log(currentTime,givenTimeObj,timeDifferenceInMinutes);

  return timeDifferenceInMinutes < 10;
}
router.post("/attended/:classid", authenticate, async (req, res) => {
  try {
    let classId = req.params.classid;

    let isattended = await Attendence.find({
      class_id: classId,
      user_id: req.user.id,
    });
    if (check(isattended)) {
      return res
        .status(201)
        .json({ msg: "Already marked attendence"});
    }
    let gymclass = await Class.findById(classId);
    if (!gymclass) {
      return res.status(201).json({msg: "No class Found"});
    }
    let bgymclass = await Booking.findOne({
      class_id: classId,
      user_id: req.user.id,
    });
    if (!bgymclass) {
      return res
        .status(201)
        .json({ msg: "You havent booked this class"  });
    }
    // let starttime=gymclass.schedule.split("-")[0];
    let endtime = gymclass.schedule.split("-")[1];
    console.log(endtime);
    if (is10minute(endtime) == true) {
      let attendence = new Attendence({
        class_id: classId,
        user_id: req.user.id,
        attended: true,
      });
      await attendence.save();
      return res
        .status(200)
        .json({ msg: "Your attendence marked succesfully" });
    } else {
      return res.status(201).json({ msg: "you are late" });
    }
  } catch (e) {
    // try{
    //     let classId=req.params.classid;
    //     let attendence=new Attendence({class_id:classId,user_id:req.user.id,attended:true});
    //         await attendence.save();
    //         return res.status(200).json({msg:"Your attendence marked succesfully"});
    // }
    console.log(e);
    res.status(500).json({ msg: e.message });
  }
});

function calculate(givenDateStr) {
  const givenDate = new Date(givenDateStr);
  const today = new Date();
  const timeDifference = today.getTime() - givenDate.getTime();
  const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

  return daysDifference;
}
router.get("/attendence", authenticate, async (req, res) => {
  try {
    let bookings = await Booking.find({ user_id: req.user.id }).populate("class_id");
    if (!bookings) {
      return res.status(400).json({ msg: "no class booked for this user" });
    }
    let a = [];
    for (let i = 0; i < bookings.length; i++) {
      // console.log(bookings[i]);
      let classId = bookings[i].class_id._id;
      console.log(classId)
      let attended = await Attendence.find({
        class_id: classId,
        user_id: req.user.id,
      })
        .populate("user_id")
        .populate("class_id");
      if (attended[0]) {
        let days = calculate(attended[0].class_id.start);
        console.log(days);
        let thisatt = {
          id: attended[0]._id,
          class: attended[0].class_id.title,
          description: attended[0].class_id.description,
          total: days,
          attend: 0,
        };
        for (let j = 0; j < attended.length; j++) {
          if (attended[j].attended) {
            thisatt.attend = thisatt.attend + 1;
          }
        }
        a[i] = thisatt;
      } else {
        let days = calculate(bookings[i].class_id.start);
        // console.log(days);
        let thisatt = {
          id: bookings[i].class_id._id,
          class: bookings[i].class_id.title,
          description: bookings[i].class_id.description,
          total: days,
          attend: 0,
        };

        a[i] = thisatt;
      }
    }
    res.status(200).json({ a, bookings });
    // res.status(200).json({a:"a"});
  } catch (e) {
    console.log(e);
    res.status(500).json({ msg: e.message });
  }
});
async function foruser(user){
    let a = [];
    let bookings = await Booking.find({ user_id: user._id }).populate("class_id");
    if (!bookings) {
      return a
    }
    for (let i = 0; i < bookings.length; i++) {
      
      let classId = bookings[i].class_id._id;
      // console.log(classId)
      let attended = await Attendence.find({
        class_id: classId,
        user_id: user._id,
      })
        .populate("user_id")
        .populate("class_id");
      if (attended[0]) {
        let days = calculate(attended[0].class_id.start);
        // console.log(days);
        let thisatt = {
          id: attended[0]._id,
          class: attended[0].class_id.title,
          description: attended[0].class_id.description,
          total: days,
          attend: 0,
        };
        for (let j = 0; j < attended.length; j++) {
          if (attended[j].attended) {
            thisatt.attend = thisatt.attend + 1;
          }
        }
        a[i] = thisatt;
      } else {
        let days = calculate(bookings[i].class_id.start);
        // console.log(days);
        let thisatt = {
          id: bookings[i].class_id._id,
          class: bookings[i].class_id.title,
          description: bookings[i].class_id.description,
          total: days,
          attend: 0,
        };

        a[i] = thisatt;
      }
    }
    // console.log(a)
    return a;
  
}
router.get("/all", requireadmin, async (req, res) => {
  try {
    let users=await User.find({isAdmin:false});
    let b=[];
    if(!users){res.status(201).json({msg:"Sorry no user found" });}
    for(let i=0;i<users.length;i++){
      a=await foruser(users[i]);
      b[i]={user:users[i],a:a};
    }
    res.status(200).json({ b });
  } catch (e) {
    console.log(e);
    res.status(500).json({ msg: e.message });
  }
});

module.exports = router;
