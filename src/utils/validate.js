const validator = require("validator");

const validateSignupData=(req)=>{
    const {firstName,lastName,emailId,password}= req.body;
    if(!firstName || !lastName){
        throw new Error("First name and last name are required");
    }
}

module.exports={validateSignupData};