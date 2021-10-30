const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
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
        bucket: 'leash-file',
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

//upload request file
router.route('/uploadFile').post(verifyToken, (req, res, next) => {
    uploadToS3(req, res)
        .then(downloadUrl => {

            //get object to show and res to front end
            const params = {
                Bucket: "leash-file",
                Key: downloadUrl
            }

            s3.getObject(params, function (err, data) {
                if (err) console.log(err)
                console.log("data"+data)
                const b64 = Buffer.from(data.Body).toString('base64');
                const mimeType = 'application/pdf';
                return res.json({
                    file: `data:${mimeType};base64,${b64}`,
                    veterinarian_file: downloadUrl
                });
            })
        })
        .catch(e => {
            next(e)
        })
})

//route to remove selected request file from prepare stage
router.route(`/removeSelectedFile/:s3key`).post((req, res, next) => {

    const params = {
        Bucket: "leash-file",
        Key: req.params.s3key
    }

    s3.deleteObject(params, function (err, data) {
        if (err) return console.log(err)
        else {
            return res.send("successfully delete")
        }
    })
})

//route to show request file image
router.route(`/showFile/:file`).get(verifyAdmin ,async(req, res, next) => {
    const arrayOfLinks = req.params.file

        const params = {
          Bucket: "leash-file",
          Key: arrayOfLinks
        }
        await s3.getObject(params).promise().then( (data) => {
          const b64 = Buffer.from(data.Body).toString('base64');
          const mimeType = 'application/pdf';
          return res.json({veterinarian_file:`data:${mimeType};base64,${b64}`})
        }).catch(e => {
          console.log(e)
        })
  })

module.exports = router;