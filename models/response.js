const mongoose = require('mongoose');
const responseSchema = new mongoose.Schema({
    formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
        },
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Form.questions',
            required: true
        },
        questionText: {
            type: String,
            required: true
        },
        answer: [{
            type: String,
            required: true
        }]
    }]
}, { timestamps: true });

module.exports = mongoose.model('Response', responseSchema);
