const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    fullname: {
        type: String
    },
    username: {
        type: String
    },
    password: {
        type: String
    },
    interesting: {
        type: [String]
    },
    veterinarian_file: {
        type: String
    },
    admin_approval: {
        type: Boolean
    }
}, 
    {
    collection : "users"
    }
);

const User = mongoose.model("User", UserSchema)
module.exports = User