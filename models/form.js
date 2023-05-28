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
        open: {type: Boolean, default: false},
        questionText: String,
        questionImage: {type: String, default: ""},
        options: [{
          optionText : String,
          optionImage: {type: String, default: ""},
        }],
      }],
      formType: {
        type: String,
        required: true,
        },

}, { timestamps: true });

module.exports = mongoose.model('Form', formSchema);