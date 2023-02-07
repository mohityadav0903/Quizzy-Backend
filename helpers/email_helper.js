const nodemailer = require('nodemailer');
const jwtHelper = require('../helpers/jwt_helper');
const dotenv = require('dotenv');
const createError = require('http-errors');
dotenv.config();

const sendVerifyEmail = async (user, req, res ) => {
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
    https://quizzy-backend.vercel.app/api/users/verify/${user.role}/${user._id}/${EmailToken} 
    Thanks`
}
transport.sendMail(clientmail,(err,info)=>{
    if(err){
        console.log(err);
        res.status(500).json({message:'Internal server error'});
    }
    else{
        console.log('email sent'+info.response);
        res.status(200).json({message:'Email sent successfully'});
    }

}
)
}

module.exports = {
    sendVerifyEmail
}