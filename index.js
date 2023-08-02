const express = require("express");
const app = express();
const cors = require("cors");
const dotEnv = require("dotenv");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Booking = require("./models/Bookclass");
const moment = require("moment");
const nodemailer = require("nodemailer");

let bookings = {};
app.use(cors());

app.use(
  bodyParser.json({
    limit: "50mb",
  })
);

app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    parameterLimit: 100000,
    extended: true,
  })
);

// dotEnv Configuration
dotEnv.config({ path: "./.env" });

const port = process.env.PORT || 5001;

// mongoDB Configuration
mongoose
  .connect(process.env.URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((response) => {
    console.log("DB Connected");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1); // stop the process if unable to connect to mongodb
  });

// router configuration
app.use("/api/users", require("./routers/userrouter"));
app.use("/api/class", require("./routers/classrouter"));
app.use("/api/booking", require("./routers/bookingrouter"));
app.use("/api/attedence", require("./routers/attendencerouter"));
const sendEmail = (recipientEmail,name,instructor) => {
  console.log(recipientEmail)
  console.log(name)
  console.log(instructor)

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
          to: recipientEmail,
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
              <p>Your Booked class is going to start in less than 10 minutes</p>
              <p>Here is details of class</p>
              <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;"><div>Name:${name}</div>Instructor:${instructor}</h2>
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
          console.log("done");
          return resolve({ message: "Email sent succesfuly" });
        });
      });
};
const checkAndSendEmails = async() => {
  const currentTime = moment();

  for (let i = 0; i < bookings.length; i++) {
   
    let time = bookings[i].class_id.schedule.split("-")[0];
    let email = bookings[i].user_id.email;
    const [startTime, _] = time.split('-');
    const scheduledStartTime = moment(startTime, 'HH:mm');

    const timeDifferenceInMinutes = scheduledStartTime.diff(currentTime, 'minutes');
    console.log(timeDifferenceInMinutes);
    if (timeDifferenceInMinutes >= 0 && timeDifferenceInMinutes <= 10) {
      sendEmail(email,bookings[i].class_id.title,bookings[i].class_id.instructor);
    }
    
  }
};
const getbookings=async()=>{
  bookings = await Booking.find().populate("user_id").populate("class_id");
}
const emailCheckInterval = setInterval(checkAndSendEmails, 600000);
const getbooking = setInterval(getbookings, 599980);


app.listen(port, () => {
  console.log(`Express Server is Started at PORT : ${port}`);
});
