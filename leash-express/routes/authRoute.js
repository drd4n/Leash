const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const { check, body, validationResult } = require('express-validator')

const router = express.Router()
const app = express()

app.use(express.urlencoded({ extended: false }))

//User Models
const UserModel = require('../models/User');

router.route('/register').post(
    [
        body('firstname', 'firstname is required').not().isEmpty(),
        body('lastname', 'lastname is required').not().isEmpty(),
        body('email', 'email is required').not().isEmpty(),
        body('email', 'email is not valid').isEmail(),
        body('dob', 'birth date is required').not().isEmpty(),
        body('dob', 'birth date is not valid').not().isDate({ format: 'DD/MM/YYYY', strictMode: true }),
        body('username', 'username is required').not().isEmpty(),
        body('password', 'password is required').not().isEmpty(),
        body('crPassword', 'confirm password is required').not().isEmpty(),
        check("password", "invalid password")
            .custom((value, { req, loc, path }) => {
                if (value !== req.body.crPassword) {
                    // trow error if passwords do not match
                    throw new Error("Passwords don't match");
                } else {
                    return value;
                }
            })
    ],
    (req, res, next) => {

        // const firstname = req.body.firstname
        // const lastname = req.body.lastname
        // const email = req.body.email
        // const dob = req.body.dob
        // const username = req.body.username
        // const password = req.body.password
        // check('password', 'Password is invalid').not().equals(req.body.crPassword);

        const errors = validationResult(req);
        if (errors.errors.length > 0) {
            console.log('xxxx')
            return res.status(400).json({ errors: errors.mapped() })
        }

        //check duplicated email and username

        console.log(req.body.dob)
        const user = new UserModel({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            dob: req.body.dob,
            username: req.body.username,
            password: req.body.password
        })
        return res.status(200).json(user)

    })

module.exports = router;