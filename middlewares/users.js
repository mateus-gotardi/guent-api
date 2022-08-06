require('dotenv').config()


const WithAuth = (req, res, next) => {
        next()
}

module.exports = WithAuth