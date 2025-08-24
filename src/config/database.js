const mongoose = require('mongoose');

const connectDB = async () => {
    await mongoose.connect('mongodb+srv://namastenode:vaidya20080092@namastenode.ccvj8bv.mongodb.net/DevMatch');
};

module.exports = connectDB;