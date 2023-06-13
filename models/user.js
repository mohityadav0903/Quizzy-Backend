const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    spam : {
        type: Boolean,
        default: false
    },
   password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'user'
    },
    forms: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form'
    }],
    responses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form'
    }],
    responseTime: [{
        formId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Form'
        },
        time: {
            type: Number,
            default: 0
        }
    }],
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);
