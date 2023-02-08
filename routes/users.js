const router = require('express').Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const { signAccessToken, signEmailToken, verifyAccessToken} = require('../helpers/jwt_helper');
const createError = require('http-errors');
const { sendVerifyEmail } = require('../helpers/email_helper');
const isAdmin = require('../middlewares/isAdmin');

router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const emailExist = await User.findOne({ email: email });
        if(emailExist) throw createError.Conflict('Email is already  registered');
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword
        });
        const result = await user.save();
        //send the response to the user after email is sent
        await sendVerifyEmail(result, req, res);

    } catch (error) {
        if (error.isJoi === true) error.status = 422;
        next(error);
    }
}
);

router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (!user) throw createError.NotFound('User not registered');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw createError.Unauthorized({statusText: 'Invalid credentials', status: 401});
        const isEmailVerified = user.isEmailVerified;
        if (!isEmailVerified) throw createError.Forbidden({statusText: 'Please verify your email', status: 403});
        const accessToken = await signAccessToken(user);
        res.status(200).send({ accessToken });
    } catch (error) {
        next(error);
    }
});

router.get('/verify/:role/:id/:token', async (req, res, next) => {
    try {
        const { role, id, token } = req.params;
        const payload = await verifyAccessToken(token);
        if (payload.id !== id) throw createError.Unauthorized('Invalid token');
        if (payload.role !== role) throw createError.Unauthorized('Invalid token');
        const user = await User.findById(id);
        if (!user) throw createError.NotFound('User not found');
        if (user.isEmailVerified) throw createError.Conflict('your email already verified! please login');
        user.isEmailVerified = true;
        await user.save();
        res.send('your email is verified');
    } catch (error) {
        next(error);
    }
});

//get all users
router.get('/all', isAdmin, async (req, res, next) => {
    try {
        const users = await User.find();
        const userWithoutPassword = users.map((user) => {
            const { password, ...data } = user._doc;
            return data;
        });
        res.status(200).send(userWithoutPassword);
    } catch (error) {
        next(error);
    }
});





module.exports = router;