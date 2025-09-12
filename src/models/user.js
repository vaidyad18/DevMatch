const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
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
        if (!validator.isStrongPassword(value)) {
          throw new Error("Password is not strong enough");
        }
      },
    },
    age: {
      type: Number,
      min: 18,
    },
    mobile: {
      type: Number,
      unique: true,
      trim: true,
    },
    gender: {
      type: String,
      validate(value) {
        if (!["Male", "Female", "Other"].includes(value)) {
          throw new Error("No a valid gender");
        }
      },
    },
    photoURL: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIf4R5qPKHPNMyAqV-FjS_OTBB8pfUV29Phg&s",
      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error("Not a valid URL");
        }
      },
    },
    description: {
      type: String,
      maxlength: 200,
      default: "Hey there! I am using DevMatch.",
    },
    skills: {
      type: [String],
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    membershipType: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

userSchema.index({firstName:1, lastName:1});

userSchema.methods.getJWT = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id }, "Vaidya@18#",{ expiresIn: '1d' });
  return token;
};

userSchema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;
  const hashedPassword = user.password;
  const isPassordValid = await bcrypt.compare(passwordInputByUser, hashedPassword);
  return isPassordValid;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
