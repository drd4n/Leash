const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { check, body, validationResult } = require('express-validator')

const router = express.Router()
const app = express()

app.use(express.urlencoded({ extended: false }))

//User Models
const UserModel = require('../models/User');

//register
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
    async (req, res, next) => {

        // const firstname = req.body.firstname
        // const lastname = req.body.lastname
        // const email = req.body.email
        const dob = req.body.dob
        // const username = req.body.username
        // const password = req.body.password
        // check('password', 'Password is invalid').not().equals(req.body.crPassword);

        const errors = validationResult(req);
        if (errors.errors.length > 0) {
            console.log('xxxx')
            return res.status(400).json({ errors: errors.mapped() })
        }

        //check duplicated email and username
        const emailChecker = await UserModel.findOne({email: req.body.email})
        if(emailChecker){
            return res.status(400).json({errors:"This E-mail has been used"})
        }

        const usernameChecker = await UserModel.findOne({username: req.body.username})
        if(usernameChecker){
            return res.status(400).json({errors: "This Username has been used"})
        }
        
        console.log(new Date('10-10-2021'))
        const newDob = new Date(dob).setHours(new Date(dob).getHours()+7)
        // .toLocaleString('en-GB', {
        //     timeZone: 'Asia/Bangkok'
        // })
        console.log(new Date(newDob))
        const user = new UserModel({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            dob: newDob,
            username: req.body.username,
            password: req.body.password
        })

        bcrypt.genSalt(10 , (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                if(err){
                    console.log(err)
                }
                user.password = hash
                user.save((err) => {
                    if(err){
                        console.log(err)
                        return
                    } else {
                        return res.status(201).json({message: "You are now registered"})
                    }
                })
            })
        })
    })

    //login
    router.route('/login').post(async(req, res, next) => {
        const username = req.body.username
        const password = req.body.password
        const user = await UserModel.findOne({username:username})
        if(!user){
            return res.status(400).json({errors: "This username is not exist"})
        }
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if(err) return res.status(400).json({errors:"username or password invalid"})
            if(isMatch){
                const token = jwt.sign(
                    {user_id: user._id},
                    process.env.TOKEN_KEY,
                    {
                        expiresIn:"120000"
                    }
                )
                user.token = token
                user.save()
                return res.status(200).json(user)
            } else {
                return res.status(400).json({errors:"username or password invalid"})
            }
        })
        
        // passport.authenticate('local',{ 
        //     successRedirect: '/ping',
        //     failureRedirect: '/auth/login' })
        //     (req, res, next)
    })

    //get login failed message
    router.route('/login').get((req, res, next) => {
        return res.status(400).json({errors:"username or password not found"})
    })

    //isLoggin?
    router.route('/isLoggedin').get((req,res,next) => {

    })

module.exports = router;