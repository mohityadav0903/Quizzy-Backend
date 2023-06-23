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
            type: String,
            required: true
        },
        questionText: {
            type: String,
            required: true
        },
        questionType: {
            type: String,
            required: true
        },
        options: [{
            optionText: {
                type: String,
            },
            optionImage: {
                type: String,
                default: ""
            }

        }],
        answer: [{
            type: String,
            required: true
        }]
    }],
    score: {
        type: Number,
        default: 0
    },
}, { timestamps: true });

module.exports = mongoose.model('Response', responseSchema);
