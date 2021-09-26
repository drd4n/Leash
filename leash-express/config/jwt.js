const jwt = require('jsonwebtoken')
const config = process.env

const verifyToken = (req, res, next) => {
    const token = req.headers['x-access-token'] || req.body.token

    if(!token) {
        return res.status(403).json({errors:"Token needed for authentication"})
    }

    try {
        const decoded = jwt.verify(token, config.TOKEN_KEY)
        req.user = decoded
    } catch(err) {
        return res.status(401).json({errors:"Invalid Token"})
    }

    return next()
}

module.exports = verifyToken