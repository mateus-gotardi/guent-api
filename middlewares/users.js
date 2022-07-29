require('dotenv').config()


const WithAuth = (req, res, next) => {
    if (req.session.login) {
        next()
    } else {
        res.status(401).json({ error: 'Invalid credentials' })
    }

}

module.exports = WithAuth