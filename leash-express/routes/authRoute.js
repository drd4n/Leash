const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { check, body, validationResult } = require('express-validator')
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const router = express.Router()
const app = express()
app.use(express.json())
app.use(cors())
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }))

//User Models
const UserModel = require('../models/User');
const AdminModel = require('../models/Admin')
const verifyToken = require('../config/jwt');
const verifyAdmin = require('../config/adminVerify')
const s3config = require('../config/s3config');

aws.config.update(s3config.credentials)
const s3 = new aws.S3()

//setup where to upload piture to, before route
var uploadPicture = multer({
    storage: multerS3({
        s3,
        bucket: 'leash-user',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, req.s3Key)
        }
    })
})

//define function upload to s3
const singleFileUpload = uploadPicture.single('image');

function uploadToS3(req, res) {
    req.s3Key = uuidv4();
    let downloadUrl = `${req.s3Key}`
    return new Promise((reslove, reject) => {
        return singleFileUpload(req, res, err => {
            if (err) return reject(err);
            return reslove(downloadUrl)
        })
    })
}

//upload profile images
router.route('/uploadProfileImage').post((req, res, next) => {
    uploadToS3(req, res)
        .then(downloadUrl => {

            //get object to show and res to front end
            const params = {
                Bucket: "leash-user",
                Key: downloadUrl
            }

            s3.getObject(params, function (err, data) {
                if (err) console.log(err)
                const b64 = Buffer.from(data.Body).toString('base64');
                const mimeType = 'image/jpg';
                return res.json({
                    src: `data:${mimeType};base64,${b64}`,
                    picture_link: downloadUrl
                });
            })
        })
        .catch(e => {
            next(e)
        })
})

//route to remove selected image from pre-post
router.route(`/removeSelectedImage/:s3key`).post((req, res, next) => {

    const params = {
        Bucket: "leash-user",
        Key: req.params.s3key
    }

    s3.deleteObject(params, function (err, data) {
        if (err) return console.log(err)
        else {
            return res.send("successfully delete")
        }
    })
})

//route to request profile image for user
router.route(`/showProfileImage/:profile_picture`).get(verifyToken ,async(req, res, next) => {
    const arrayOfLinks = req.params.profile_picture

        const params = {
          Bucket: "leash-user",
          Key: arrayOfLinks
        }
        await s3.getObject(params).promise().then( (data) => {
          const b64 = Buffer.from(data.Body).toString('base64');
          const mimeType = 'image/jpg';
          return res.json({profile_src:`data:${mimeType};base64,${b64}`})
        }).catch(e => {
          console.log(e)
        })
  })

//save profile image to database
router.route('/saveProfilePicture').post(verifyToken, async (req, res, next) => {
    const profile_picture = req.body.profile_picture
    const user = await UserModel.findById(req.user._id)
    user.profile_picture = profile_picture
    user.save()
    return res.send("Your profile picture has been saved!")
})

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
        const emailChecker = await UserModel.findOne({ email: req.body.email })
        if (emailChecker) {
            return res.status(400).json({ errors: "This E-mail has been used" })
        }

        const usernameChecker = await UserModel.findOne({ username: req.body.username })
        if (usernameChecker) {
            return res.status(400).json({ errors: "This Username has been used" })
        }

        console.log(new Date('10-10-2021'))
        const newDob = new Date(dob).setHours(new Date(dob).getHours() + 7)
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

        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                if (err) {
                    console.log(err)
                }
                user.password = hash
                user.save((err) => {
                    if (err) {
                        console.log(err)
                        return
                    } else {
                        const token = jwt.sign(
                            { _id: user._id },
                            process.env.TOKEN_KEY,
                            {
                                expiresIn: "2d"
                            }
                        )
                        user.token = token
                        user.save()
                        return res.status(201).json(user)
                    }
                })
            })
        })
    })

//login
router.route('/login').post(async (req, res, next) => {
    const username = req.body.username
    const password = req.body.password
    const user = await UserModel.findOne({ username: username })
    if (!user) {
        return res.status(400).json({ errors: "This username is not exist" })
    }
    bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return res.status(400).json({ errors: "username or password invalid" })
        if (isMatch) {
            const token = jwt.sign(
                { _id: user._id },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "2d"
                }
            )
            user.token = token
            user.save()
            return res.status(200).json(user)
        } else {
            return res.status(400).json({ errors: "username or password invalid" })
        }
    })
})

//admin login
router.route('/admin').post(async(req, res, next) => {
    const username = req.body.username
    const password = req.body.password
    const admin = await AdminModel.findOne({ username: username })
    if (!admin) {
        return res.status(400).json({ errors: "This username is not exist" })
    }
    bcrypt.compare(password, admin.password, (err, isMatch) => {
        if (err) return res.status(400).json({ errors: "username or password invalid" })
        if (isMatch) {
            const token = jwt.sign(
                { username: admin.username, admin_fullname: admin.admin_fullname },
                process.env.ADMIN_KEY,
                {
                    expiresIn: "2d"
                }
            )
            admin.admin_token = token
            admin.save()
            return res.status(200).json(admin)
        } else {
            return res.status(400).json({ errors: "username or password invalid" })
        }
    })
})

//admin logout
router.route('/adminLogout').post(verifyAdmin, async (req, res, next) => {
    try {
        const admin = await AdminModel.findByIdAndUpdate(req.user._id, { $unset: { token: 1 } })
        return res.status(200).json({ message: "logged out" })
    } catch {
        return res.status(401).json({ errors: "you are not loggedin" })
    }

})

//get login failed message
router.route('/login').get((req, res, next) => {
    return res.status(400).json({ errors: "username or password not found" })
})

router.route('/logout').post(verifyToken, async (req, res, next) => {
    try {
        const user = await UserModel.findByIdAndUpdate(req.user._id, { $unset: { token: 1 } })
        return res.status(200).json({ message: "logged out" })
    } catch {
        return res.status(401).json({ errors: "you are not loggedin" })
    }

})

//who am I
router.route('/whoAmI').get(verifyToken, async (req, res, next) => {
    const user = await UserModel.findById(req.user._id)
    return res.json(user)
})

router.route('/profile/:user_id').get(verifyToken, async (req, res, next) => {
    try{
        const user = await UserModel.findById(req.params.user_id)
        const userData = {
            _id: req.params.user_id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            dob: user.dob,
            username: user.username
        }
        if(user.profile_picture){
            userData.profile_picture = user.profile_picture
        }

        if(user.approval_status){
            userData.approval_status = user.approval_status
        }

        return res.json(userData)
    }catch{
        return res.status(400).json({errors:"This user is not exist"})
    }
})

module.exports = router;