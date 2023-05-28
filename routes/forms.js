const router = require('express').Router();
const Form = require('../models/form');
const User = require('../models/user');
const { verifyAccessToken } = require('../helpers/jwt_helper');
const createError = require('http-errors');
const e = require('express');

router.post('/create', async (req, res, next) => {
    try {
        const { formName, formType, createdBy } = req.body;
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

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const form =await  Form.findById(id);
        if(!form) throw createError.NotFound('Form not found');
        res.status(200).json({ form });

    }
    catch (error) {
        next(error);
    }
});

router.get('/all/:userId', async (req, res, next) => {
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




module.exports = router;