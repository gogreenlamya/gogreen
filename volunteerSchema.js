const mongoose = require('mongoose');

const volunteerSchema = mongoose.Schema({
    firstname: String,
    lastname: String,
    dob: String,
    email: String,
    phone: Number,
    initiative: String,
}, { timestamps: true });


const Volunteer = mongoose.model('Volunteer', volunteerSchema);

module.exports = Volunteer;