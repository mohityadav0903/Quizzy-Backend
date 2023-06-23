const router = require('express').Router();
const Response = require('../models/response');
const Form = require('../models/form');
const User = require('../models/user');
const { verifyAccessToken } = require('../helpers/jwt_helper');
const createError = require('http-errors');
const ExcelJS = require('exceljs');

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
        //calculate score
        let score = 0;
        let newAnswers = [];
        const questions = formExist.toObject().questions;
        if(formExist.toObject().formType == 'Quiz')
        {
        questions.forEach((question) => {
            answers.forEach((answer) => {
                if (answer.questionId == question._id) {
                    if (question.type == 'Checkboxes' || question.type == 'Multiple Choice') {
                        if (question.correctAnswers.length == answer.answer.length) {
                            let flag2= true;
                            question.correctAnswers.forEach((correctAnswer) => {
                                let flag3 = false;
                                answer.answer.forEach((ans) => {
                                    if (ans == correctAnswer) {
                                        flag3 = true;
                                    }
                                });
                                if (!flag3) {
                                    flag2 = false;
                                }
                            });
                            if (flag2) {
                                score += question.marks;
                            }
                        }
                    }
                    else{
                        if(question.correctAnswers[0] == answer.answer[0])
                        {
                            score += question.marks;
                        }
                    }
                } 
            })
        });
        }
      console.log(score);  
       // change the optionId in answers for Checkboxes and Multiple Choice questions to optionText
       newAnswers = answers.map((answer) => {
            questions.forEach((question) => {
                if (answer.questionId == question._id) {
                    if (question.type == 'Checkboxes' || question.type == 'Multiple Choice') {
                        let newAnswer = [];
                        answer.answer.forEach((ans) => {
                            question.options.forEach((option) => {
                                if (option._id == ans) {
                                    newAnswer.push(option.optionText);
                                }
                            });
                        });
                        answer.answer = newAnswer;
                    }
                }
            });
            return answer;
        });
        const response = new Response({
            formId,
            userId,
            answers: newAnswers,
            score
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
                id : user._id,
                responseTime : user.responseTime.filter((responseTime) => responseTime.formId == formId)[0].time
            }
        });

        
        res.status(200).json({ message: 'Responses fetched successfully',responses:{responses,responseUsers} });   
    }
    catch (error) {
        next(error);
    }
});

router.delete('/:responseId/:userId', async (req, res, next) => {
    try {
        const { responseId, userId } = req.params;
        const responseExist = await Response.findById(responseId);
        if (!responseExist) throw createError.NotFound('Response not found');
        const userExist = await User.findById(userId);
        if (!userExist) throw createError.NotFound('User not found');
        const formExist = await Form.findById(responseExist.toObject().formId);
        if (!formExist) throw createError.NotFound('Form not found');
        if (formExist.toObject().createdBy != userId) {
            throw createError.Unauthorized('You are not authorized to delete this response');
        }
        const responseUser = await User.findById(responseExist.toObject().userId);
        await responseUser.updateOne({ $pull: { responses: formExist.toObject()._id, responseTime: { formId: formExist.toObject()._id } } }).then(async () => {
            await responseExist.deleteOne();
            res.status(200).json({ message: 'Response deleted successfully' });
        }
        );
    }
    catch (error) {
        next(error);
    }
});

/*export all responses of a form in csv format*/
router.get('/export/:formId/:userId', async (req, res, next) => {
    try {
        const { formId, userId } = req.params;
        const formExists = await Form.findById(formId);
        if (!formExists) throw createError.NotFound('Form not found');
        const userExists = await User.findById(userId);
        if (!userExists) throw createError.NotFound('User not found');
        if (formExists.toObject().createdBy != userId) {
            throw createError.Unauthorized('You are not authorized to export responses of this form');
        }
        const responses = await Response.find().where('formId').equals(formId);
        if (!responses) throw createError.NotFound('No responses found');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`${formExists.toObject().formName + ' responses'}`);
        worksheet.columns = [
            {header:'S.No',key:'sno',width:10},
            { header: 'Email', key: 'email', width: 30},
            { header: 'Response Time', key: 'responseTime', width: 30 },
            { header: 'Submitted On', key: 'submittedOn', width: 30 },
            { header: 'Score', key: 'score', width: 10},
            ...formExists.toObject().questions.map((question) => {
                return { header: question.questionText, key: question.questionText, width: 30 }
            })
        ];
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { horizontal: 'center' };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9D9D9' }
        };
        worksheet.getColumn(1).alignment = { horizontal: 'center' };
        worksheet.getColumn(1).font = { bold: true };
        worksheet.getColumn(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9D9D9' }
        };


        let sno = 1;
        const getFormattedDate = (date) => {
            const d = new Date(date);
            return d.toLocaleString();
        }
        const getResponseTime = (responseTime) => {
            const minutes = Math.floor(responseTime / 60);
            const seconds = responseTime % 60;
            return `${minutes} minutes ${seconds} seconds`;
        }
        const responseUsers = await User.find().where('_id').in(responses.map((response) => response.userId));
        const responseUsersMap = responseUsers.reduce((map, user) => {
            map[user._id] = user;
            return map;
        }, {});
       
                responses.forEach((response) => {
            const user = responseUsersMap[response.toObject().userId];
            const responseTime = getResponseTime(user?.responseTime.filter((responseTime) => responseTime.formId == formId)[0].time);
            const submittedOn = getFormattedDate(response.toObject().createdAt);
            const totalScore = formExists.toObject().questions.reduce((totalScore, question) => {
                 totalScore += question.marks;
                    return totalScore;
                }, 0);
            const score = response.toObject().score + '/' + totalScore;
            const answers = response.toObject().answers;
          

            const row = {
                sno,
                email: user?.email,
                responseTime,
                submittedOn,
                score: score
            };
           answers.forEach((answer) => {
                row[answer.questionText] = answer.answer;
            });
            worksheet.addRow(row);
            sno++;
        });
        
        const fileName = `${formExists.toObject().formName + ' responses'}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        await workbook.xlsx.write(res);
        res.status(200).end();
    }
    catch (error) {
        next(error);
    }
});

module.exports = router;