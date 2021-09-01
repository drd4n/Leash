const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
    firstname: {
        type: String,
        require: true
    },
    lastname: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: 'Email is required'
    },
    dob: {
        type: Date,
        require: true
    },
    username: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    interesting: {
        type: [String]
    },
    veterinarian_file: {
        type: String
    },
    admin_approval: {
        type: String
    }
}, 
    {
    collection : "users"
    }
);

const User = mongoose.model("User", UserSchema)
module.exports = User