const validator = require("validator");

const validateSignupData = (req) => {
  const { firstName, lastName, emailId, password } = req.body;
  if (!firstName || !lastName) {
    throw new Error("First name and last name are required");
  }
};

const validateProfileEditData = (req) => {
  const ALLOWED_UPDATES = [
    "firstName",
    "lastName",
    "emailId",
    "age",
    "mobile",
    "gender",
    "photoURL",
    "description",
    "skills",
  ];
  const isAllowed = Object.keys(req.body).every((field) =>
    ALLOWED_UPDATES.includes(field)
  );
  return isAllowed;
};

module.exports = { validateSignupData, validateProfileEditData };
