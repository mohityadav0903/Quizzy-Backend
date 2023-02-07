const nodemailer = require('nodemailer');
const jwtHelper = require('../helpers/jwt_helper');
const dotenv = require('dotenv');
dotenv.config();

const sendVerifyEmail = async (user) => {
    const EmailToken= await jwtHelper.signEmailToken(user);
const transport= nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:process.env.EMAIL,
        pass: process.env.PASSWORD,
    }
})

const clientmail ={
    to: user.email,
    subject: "Thanks for signing up",
    text: `Hi! There, You have recently visited 
    our website and entered your email.
    Please follow the given link to verify your email
    http://localhost:5000/api/users/verify/${user.role}/${user._id}/${EmailToken} 
    Thanks`
}
transport.sendMail(clientmail,(err,info)=>{
    if(err){
        console.log(err);
     return(err);
    }
    else{
        console.log('email sent'+info.response);
        return(info.response);
    }

}
)
}

module.exports = {
    sendVerifyEmail
}