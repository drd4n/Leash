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
const PostModel = require('../models/Post')
const verifyToken = require('../config/jwt');
const verifyAdmin = require('../config/adminVerify')
const s3config = require('../config/s3config');

aws.config.update(s3config.credentials)
const s3 = new aws.S3()

//setup where to upload piture to, before route
var uploadFile = multer({
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

var uploadPicture = multer({
    storage: multerS3({
        s3,
        bucket: 'leash-picture-request',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, req.s3Key)
        }
    })
})

//define function upload to s3
const singlePictureUpload = uploadPicture.single('image')
const singleFileUpload = uploadFile.single('file')

function uploadPictureToS3(req, res) {
    req.s3Key = uuidv4();
    let downloadUrl = `${req.s3Key}`
    return new Promise((reslove, reject) => {
        return singlePictureUpload(req, res, err => {
            if (err) return reject(err);
            return reslove(downloadUrl)
        })
    })
}

function uploadFileToS3(req, res) {
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
    uploadFileToS3(req, res)
        .then(downloadUrl => {

            //get object to show and res to front end
            const params = {
                Bucket: "leash-file",
                Key: downloadUrl
            }

            s3.getObject(params, function (err, data) {
                if (err) console.log(err)
                console.log("data" + data)
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

//upload request picture
router.route('/uploadVerifyPicture').post(verifyToken, (req, res, next) => {
    uploadPictureToS3(req, res)
        .then(downloadUrl => {

            //get object to show and res to front end
            const params = {
                Bucket: "leash-picture-request",
                Key: downloadUrl
            }

            s3.getObject(params, function (err, data) {
                if (err) console.log(err)
                console.log("data" + data)
                const b64 = Buffer.from(data.Body).toString('base64');
                const mimeType = 'image/jpg';
                return res.json({
                    src: `data:${mimeType};base64,${b64}`,
                    verify_picture: downloadUrl
                });
            })
        })
        .catch(e => {
            next(e)
        })
})

//route to remove selected request file from prepare stage
router.route(`/removeSelectedFile`).post(verifyToken, (req, res, next) => {

    const params = {
        Bucket: "leash-file",
        Key: req.body.s3key
    }

    s3.deleteObject(params, function (err, data) {
        if (err) return console.log(err)
        else {
            return res.send("successfully delete")
        }
    })
})

//route to remove selected request file from prepare stage
router.route(`/removeSelectedPicture`).post(verifyToken, (req, res, next) => {

    const params = {
        Bucket: "leash-picture-request",
        Key: req.body.s3key
    }

    s3.deleteObject(params, function (err, data) {
        if (err) return console.log(err)
        else {
            return res.send("successfully delete")
        }
    })
})

//save all verify data
router.route(`/submit`).post(verifyToken, async (req, res, next) => {
    await UserModel.findOneAndUpdate(req.body.filter, req.body.update)
    return res.json({ message: "successfully submit" })
})

router.route(`/check`).get(verifyToken, async (req, res, next) => {
    const user = await UserModel.findById(req.user._id)

    if (user.approval_status === "approved") {
        return res.json({ message: "sent" })
    }

    return res.json({ message: "go" })
})

//route to show all request in text
router.route(`/allRequests`).get(verifyAdmin, async (req, res, next) => {
    const requests = await UserModel.find().where("veterinarian_file").ne(null)
    return res.json(requests)
})

//route to show request file image
router.route(`/showFile/:file`).get(verifyAdmin, async (req, res, next) => {
    const arrayOfLinks = req.params.file

    const params = {
        Bucket: "leash-file",
        Key: arrayOfLinks
    }
    await s3.getObject(params).promise().then((data) => {
        const b64 = Buffer.from(data.Body).toString('base64');
        const mimeType = 'application/pdf';
        return res.json({ veterinarian_file: `data:${mimeType};base64,${b64}` })
    }).catch(e => {
        console.log(e)
    })
})

//route to show request verify image
router.route(`/showVerifyPicture/:file`).get(verifyAdmin, async (req, res, next) => {
    const arrayOfLinks = req.params.file

    const params = {
        Bucket: "leash-picture-request",
        Key: arrayOfLinks
    }
    await s3.getObject(params).promise().then((data) => {
        const b64 = Buffer.from(data.Body).toString('base64');
        const mimeType = 'image/jpg';
        return res.json({ verify_picture: `data:${mimeType};base64,${b64}` })
    }).catch(e => {
        console.log(e)
    })
})

//route to request profile image for ADMIN
router.route(`/showProfileImage/:profile_picture`).get(verifyAdmin, async (req, res, next) => {
    const arrayOfLinks = req.params.profile_picture

    const params = {
        Bucket: "leash-user",
        Key: arrayOfLinks
    }
    await s3.getObject(params).promise().then((data) => {
        const b64 = Buffer.from(data.Body).toString('base64');
        const mimeType = 'image/jpg';
        return res.json({ profile_src: `data:${mimeType};base64,${b64}` })
    }).catch(e => {
        console.log(e)
    })
})

//store admin username and fullname
router.route('/approve').post(verifyAdmin, async (req, res, next) => {
    const update = { admin_approval: { username: req.admin.username, admin_fullname: req.admin.admin_fullname }, approval_status: "approved" }
    await UserModel.findByIdAndUpdate(req.body.user_id, update)
        .catch(e => {
            console.log(e)
        })

    const postQuery = {owner:{user_id:req.body.user_id}}
    const postUpdate = {owner:{approval_status: "approved"}}
    await PostModel.updateMany(postQuery,postUpdate)
        .catch(e => {
            console.log(e)
        })
    return res.json({ message: "approved" })

})

//delete file and verify_picture both on s3 and mongo
router.route('/reject').post(verifyAdmin, async (req, res, next) => {

    const fileParams = {
        Bucket: "leash-file",
        Key: req.body.veterinarian_file
    }

    const pictureParams = {
        Bucket: "leash-picture-request",
        Key: req.body.verify_picture
    }

    s3.deleteObject(fileParams, function (err, data) {
        if (err) return console.log(err)
    })

    s3.deleteObject(pictureParams, function (err, data) {
        if (err) return console.log(err)
    })

    const update = { $unset: { veterinarian_file: 1, verify_picture: 1, admin_approval: 1 }, approval_status: "rejected" }
    await UserModel.findByIdAndUpdate(req.body.user_id, update)
        .catch(e => {
            console.log(e)
        })
    return res.json({ message: "rejected" })

}
)


router.route('/cancel').post(verifyToken, async (req, res, next) => {

    const fileParams = {
        Bucket: "leash-file",
        Key: req.body.veterinarian_file
    }

    const pictureParams = {
        Bucket: "leash-picture-request",
        Key: req.body.verify_picture
    }

    s3.deleteObject(fileParams, async function (err, data) {
        if (err) return console.log(err)
    })

    s3.deleteObject(pictureParams, function (err, data) {
        if (err) return console.log(err)
    })

    const update = { $unset: { veterinarian_file: 1, verify_picture: 1, admin_approval: 1, approval_status: 1 } }
    await UserModel.findByIdAndUpdate(req.user._id, update)
        .catch(e => {
            console.log(e)
        })
    return res.json({ message: "canceled" })

}
)

//route to show request file image
router.route(`/showPendingFile/:file`).get(verifyToken, async (req, res, next) => {
    const arrayOfLinks = req.params.file

    const params = {
        Bucket: "leash-file",
        Key: arrayOfLinks
    }
    await s3.getObject(params).promise().then((data) => {
        const b64 = Buffer.from(data.Body).toString('base64');
        const mimeType = 'application/pdf';
        return res.json({ veterinarian_file: `data:${mimeType};base64,${b64}` })
    }).catch(e => {
        console.log(e)
    })
})

//route to show request verify image
router.route(`/showPendingVerifyPicture/:file`).get(verifyToken, async (req, res, next) => {
    const arrayOfLinks = req.params.file

    const params = {
        Bucket: "leash-picture-request",
        Key: arrayOfLinks
    }
    await s3.getObject(params).promise().then((data) => {
        const b64 = Buffer.from(data.Body).toString('base64');
        const mimeType = 'image/jpg';
        return res.json({ verify_picture: `data:${mimeType};base64,${b64}` })
    }).catch(e => {
        console.log(e)
    })
})

module.exports = router;