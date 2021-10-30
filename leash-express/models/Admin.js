const mongoose = require('mongoose')

const AdminSchema = mongoose.Schema({
    admin_fullname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    admin_token: {
        type: String
    },
    citizen_id: {
        type: String,
        required: true
    }
}, 
    {
    collection : "admins"
    }
);

const Admin = mongoose.model("Admin", AdminSchema)
module.exports = Admin