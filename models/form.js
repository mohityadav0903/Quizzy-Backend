const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      formName: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        default: ""
      },
      questions : [{
        type: {type: String},
        required: {type: Boolean, default: false},
        questionText: String,
        questionImage: {type: String, default: ""},
        options: [{
          optionText: String,
          optionImage: {type: String, default: ""},
        }],
        correctAnswer: {type: String, default: ""},
        marks: {type: Number, default: 0},
        negativeMarks: {type: Number, default: 0}
      }],
      formType: {
        type: String,
        required: true,
        },
      open:{
        type: Boolean,
        default: false
      },
      theme: {
        backgroundColor: {type: String, default: "#bdf5c7"},
        headerImage: {type: String, default: ""},
        fontFamily: {type: String, default: "Arial"},
      },
      time: {
        type: Number,
        default: 0
      },
}, { timestamps: true });

module.exports = mongoose.model('Form', formSchema);