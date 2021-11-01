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
        require: 'Email is required',
        unique: true
    },
    dob: {
        type: Date,
        require: true
    },
    username: {
        type: String,
        require: true,
        unique: true
    },
    password: {
        type: String,
        require: true
    },
    token: {
        type: String
    },
    profile_picture: {
        type:String
    },
    veterinarian_file: {
        type: String
    },
    verify_picture: {
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