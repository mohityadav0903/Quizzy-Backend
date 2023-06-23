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
        let user = await User.findById(userId);
        if(!user) throw createError.NotFound('User not found');
        let flag = false;
        if(form.createdBy != userId)
        {
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
             let responseTime =  user.toObject().responseTime.find((response) => response.formId == id);
            
            const {questions} = form.toObject();
            questions.forEach((question) => {
                const {correctAnswers,...rest} = question;
                questions[questions.indexOf(question)] = rest;
            });
             const newForm = {
                ...form.toObject(),
                questions,
                responseTime: responseTime?.time
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

router.post('/responseTime', async (req, res, next) => {
    try {
        const { formId, userId, responseTime } = req.body;
        const user= await User.findById(userId);
        if(!user) throw createError.NotFound('User not found');
        const form = await Form.findById(formId);
        if(!form) throw createError.NotFound('Form not found');
        const time = user.toObject().responseTime.find((response) => response.formId == formId);
        if(!time)
        await User.updateOne({ _id: userId }, { $push: { responseTime: {formId,time:responseTime} } });
        else
        await User.updateOne({ _id: userId }, { $set: { responseTime: {formId,time:responseTime} } });
        res.status(200).json({ message: 'Response time updated successfully' });

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
        const {userId} = req.body;
        const form = await Form.findById(id);
        if (!form) throw createError.NotFound('Form not found');
        if(form.createdBy != userId)
        {
            throw createError.Unauthorized('You are not authorized to delete this form');
        }
        const responseUsers = await Response.find().where('formId').equals(id);
        if(responseUsers)
        {
            responseUsers.forEach(async (responseUser) => {
                await User.updateOne({ _id: responseUser.userId }, { $pull: { responses: id } });
            });
        }
        await Form.findByIdAndDelete(id).then(async (result) => {
             await User.updateOne({ _id: userId }, { $pull: { forms: id }, $pull: { responses: id } });
             await Response.deleteMany({formId: id});
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
        const {formName,description,theme,questions,time} = req.body;
        let formNameExists = false;
        let descriptionExists = false;
        let themeExists = false;
        let questionsExists = false;
        let timeExists = false;

        //check which fields are updated
       if(formName != form.toObject().formName)
         {
            formNameExists = true;
            }
        if(description != form.toObject().description)
        {
            descriptionExists = true;
        }
        if(theme != form.toObject().theme)
        {
            themeExists = true;
        }
        if(questions != form.toObject().questions)
        {
            questionsExists = true;
        }
        if(time != form.toObject().time)
        {
            timeExists = true;
        }
        //if values exist then update them
        if(formNameExists)
        {
            await Form.updateOne({ _id: id }, { $set: { formName: formName } });
        }
        if(descriptionExists)
        {
           await Form.updateOne({ _id: id }, { $set: { description: description } });
        }
        if(themeExists)
        {
            await Form.updateOne({ _id: id }, { $set: { theme: theme } });
        }
        if(questionsExists)
        {
            await Form.updateOne({ _id: id }, { $set: { questions: questions } });
        }
        if(timeExists)
        {
            await Form.updateOne({ _id: id }, { $set: { time: time } });
        }
        const updatedForm = await Form.findById(id);
        res.status(200).json({ message: 'Form updated successfully', updatedForm }
        );
    }
    catch (error) {
        next(error);
    }
});


module.exports = router;