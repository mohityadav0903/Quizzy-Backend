const router = require('express').Router();
const Response = require('../models/response');
const Form = require('../models/form');
const User = require('../models/user');
const { verifyAccessToken } = require('../helpers/jwt_helper');
const createError = require('http-errors');

router.post('/create', async (req, res, next) => {
    try {
        const { formId, userId, answers } = req.body;
        const formExist = await Form.findById(formId);
        if (!formExist) throw createError.NotFound('Form not found');
        const userExist = await User.findById(userId);
        if (!userExist) throw createError.NotFound('User not found');
        //find response of the user for the form
        let flag = false;
        userExist.toObject().responses.forEach((response) => {
            if (response == formId) {
                flag = true;
            }
        });
        if (flag) {
            throw createError.Conflict('Response already exists');
        }
        const response = new Response({
            formId,
            userId,
            answers
        });
        await response.save().then(async (result) => {
            await User.updateOne({ _id: userId }, { $push: { responses: result.formId }});
            res.status(200).json({ message: 'Response created successfully', result });
        });
    }
    catch (error) {
        next(error);
    }
});

router.get('/:formId/:userId', async (req, res, next) => {
    try {
        const { formId, userId } = req.params;
        const formExist= await Form.findById(formId);
        if (!formExist) throw createError.NotFound('Form not found');
        const userExist = await User.findById(userId);
        if (!userExist) throw createError.NotFound('User not found');
        let flag = false;
        if(formExist.toObject().createdBy != userId)
        {
            throw createError.Unauthorized('You are not authorized to view this response');
        }
        const responses = await Response.find().where('formId').equals(formId);
        if(!responses) throw createError.NotFound('No responses found'); 
        const users = await User.find().where('_id').in(responses.map((response) => response.userId));
        
        const responseUsers = users.map((user) => {
            return {
                email : user.email,
                id : user._id
            }
        });

        
        res.status(200).json({ message: 'Responses fetched successfully',responses:{responses,responseUsers} });   
    }
    catch (error) {
        next(error);
    }
});
module.exports = router;