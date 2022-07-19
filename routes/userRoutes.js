const express = require("express")
const userRoutes = express.Router()
const bcrypt = require('bcrypt')
const User = require('../schemas/User')
const WithAuth = require('../middlewares/users')

userRoutes.post('/login', async (req, res) => {
    const { email, password } = req.body
    try {
        let user = await User.findOne({ email })
        if (!user) {
            res.status(401).json({ error: 'incorrect email or password' })
        } else {
            user.isCorrectPassword(password, function (err, same) {
                if (!same) {
                    res.status(401).json({ error: 'incorrect email or password' })
                } else {
                    req.session.login=user._id
                    res.status(200).json({ user })
                }
            })
        }
    } catch (error) {
        res.status(500).json({ error })
    }
})

userRoutes.post('/register', async (req, res) => {
    const checkEmail = await User.findOne({ email: req.body.email })
    if (!checkEmail) {
        try {
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            const user = new User({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
                decks: [northern = {}, nilfgaardian = {}, scoiatael = {}, monster = {}]
            })
            await user.save()
            res.status(201)
        } catch (error) {
            res.json(error)
        }
    }else{
        res.status(401)
        .json({ error: 'this email already exists' })
    }
})

userRoutes.put('/update', WithAuth, async (req, res) => {
    const { newName, newEmail, newPassword, password, id } = req.body;
    let user = await User.findById(id)
    if (!user) {
        res.status(401).json({ error: 'user not found' })
    } else {
        user.isCorrectPassword(password, async (err, same) => {
            if (!same) {
                res.status(401).json({ error: 'incorrect password' })
            } else {
                const hashedPassword = await bcrypt.hash(newPassword, 10)
                user.password = hashedPassword
                user.email = newEmail
                user.name = newName
                user.save()
                res.status(200).json(user)
            }
        })
    }
})
userRoutes.delete('/delete', WithAuth, async (req, res) => {
    const { password, id } = req.body;
    let user = await User.findById(id)
    if (!user) {
        res.status(401).json({ error: 'user not found' })
    } else {
        user.isCorrectPassword(password, async (err, same) => {
            if (!same) {
                res.status(401).json({ error: 'incorrect password' })
            } else {
                await user.delete();
                res.status(200).json('user deleted successfully')
            }
        }
        )
    }
})


module.exports = userRoutes;