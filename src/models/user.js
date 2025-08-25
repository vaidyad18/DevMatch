const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  lastName: {
    type: String,
    trim: true,
  },
  emailId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Email is invalid");
      }
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
    validate(value) {
      if(!validator.isStrongPassword(value)){
        throw new Error("Password is not strong enough");
      }
    }
  },
  age: {
    type: Number,
    min:18
  },
  mobile: {
    type: Number,
    unique: true,
    trim: true,
  },
  gender: {
    type: String,
    validate(value) {
      if (!["male", "female", "other"].includes(value)) {
        throw new Error("No a valid gender");
      }
    },
  },
  photoURL:{
    type: String,
    default:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIf4R5qPKHPNMyAqV-FjS_OTBB8pfUV29Phg&s",
    validate(value) {
      if (!validator.isURL(value)) {
        throw new Error("Not a valid URL");
      }
    }
  },
  description:{
    type: String,
    maxlength: 200,
    default:"Hey there! I am using DevMatch."
  },
  skills: {
    type: [String],
  },
},{
    timestamps: true,
});

const User = mongoose.model("User", userSchema);
module.exports = User;
