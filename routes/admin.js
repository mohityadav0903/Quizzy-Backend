const router = require('express').Router();
const Admin = require('../models/admin');
const bcrypt = require('bcrypt');
const { signAccessToken, signEmailToken, verifyAccessToken} = require('../helpers/jwt_helper');
const createError = require('http-errors');
const { sendVerifyEmail } = require('../helpers/email_helper');

// router.post('/register', async (req, res, next) => {
//     const { name, email, password } = req.body;
//     try {
//         const emailExist = await  Admin.findOne({ email: email });
//         if(emailExist) throw createError.Conflict('Email is already  registered');
//         const hashedPassword = await bcrypt.hash(password, 10);
//         const admin = new Admin({
//             name,
//             email,
//             password: hashedPassword,
//         });
//         const result = await admin.save();
//         res.send(await sendVerifyEmail(result));

//     }
//     catch (error) {
//         next(error);
//     }
// });

router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ email: email });
        if (!admin) throw createError.NotFound('User not registered');
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) throw createError.Unauthorized('Username/password not valid');
        const isEmailVerified = admin.isEmailVerified;
        if (!isEmailVerified) throw createError.Unauthorized('Please verify your email');
        const accessToken = await signAccessToken(admin);
        res.status(200).send({ accessToken });
    } catch (error) {
        next(error);
    }
});

router.get('/verify/:role/:id/:token', async (req, res, next) => {
    try {
        const { role, id, token } = req.params;
        const payload = await verifyAccessToken(token);
        if(payload.id !== id) throw createError.Unauthorized('Invalid token');
        if(payload.role !== role) throw createError.Unauthorized('Invalid token');
        const user = await Admin.findById(id);
        if(!user) throw createError.NotFound('User not found');
        if(user.isEmailVerified) throw createError.Conflict('your email already verified! please login');
        user.isEmailVerified = true;
        await user.save();
        res.send('your email is verified');
    } catch (error) {
        next(error);
    }
    });

module.exports = router;
