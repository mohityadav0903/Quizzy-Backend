const router = require('express').Router();
const Form = require('../models/form');
const User = require('../models/user');
const Response = require('../models/response');
const { verifyAccessToken } = require('../helpers/jwt_helper');
const createError = require('http-errors');

router.post('/create', async (req, res, next) => {
    try {
        const { formName, formType, createdBy } = req.body;
        //if user has created 3 forms, he cannot create more
        const user = await User.findById(createdBy);
        if(user.forms.length >= 3)
        {
            throw createError.NotAcceptable('You cannot create more than 3 forms');
        }
        //find all forms created by the user
        const oldForm = await Form.find().where('createdBy').equals(createdBy);
        let flag = false;
        if(oldForm)
        {
            oldForm.forEach(async (form) => {
                if(form.formName === formName)
                {
                    flag = true;
                }
            });
        }
        if(flag)
        {
            throw createError.Conflict('Form name already exists');
        }

        const form = new Form({
            formName,
            formType,
            createdBy
        });
         await form.save().then(async (result) => {
            console.log(result)
             await User.updateOne({ _id: createdBy }, { $push: { forms: result._id } });
            res.status(200).json({ message: 'Form created successfully', result });
        });

    } catch (error) {
        next(error);
    }
});

router.get('/:id/:userId', async (req, res, next) => {
    try {
        const { id,userId } = req.params;
        const form = await Form.findById(id);
        if(!form) throw createError.NotFound('Form not found');
        const user = await User.findById(userId);
        if(!user) throw createError.NotFound('User not found');
        let flag = false;
        user.toObject().responses.forEach((response) => {
            if(response == id)
            {
                flag = true;
            }
        });
        if(flag)
        {
            throw createError.Conflict('Response already exists');
        }
        if(form.createdBy != userId)
        {
            const {questions} = form.toObject();
            questions.forEach((question) => {
                const {correctAnswer,...rest} = question;
                questions[questions.indexOf(question)] = rest;
            });
             const newForm = {
                ...form.toObject(),
                questions
             }
             
                res.status(200).json({ form: newForm });
        }
        else
        {
            res.status(200).json({ form });
        }
    }
    catch (error) {
        next(error);
    }
});

router.get('/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const forms = await Form.find().where('createdBy').equals(userId);
        if (!forms) throw createError.NotFound('No forms found');
        res.status(200).json({ forms });

    }
    catch (error) {
        next(error);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const form = await Form.findById(id);
        if (!form) throw createError.NotFound('Form not found');
        await form.deleteOne().then(async (result) => {
            await User.updateOne({ _id: form.createdBy }, { $pull: { forms: id } });
            res.status(200).json({ message: 'Form deleted successfully', result });
        });
        

    }
    catch (error) {
        next(error);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const { id} = req.params;
        const form = await Form.findById(id);
        if (!form) throw createError.NotFound('Form not found');
        const {formName,description,theme,questions} = req.body;
        const updatedForm = await Form.findByIdAndUpdate(id, {
            formName,
            description,
            theme,
            questions
        }, { new: true });
        res.status(200).json({ message: 'Form updated successfully', updatedForm }
        );
    }
    catch (error) {
        next(error);
    }
});


module.exports = router;