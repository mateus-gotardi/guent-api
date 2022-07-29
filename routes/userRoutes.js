const express = require("express")
const userRoutes = express.Router()
const bcrypt = require('bcrypt')
const User = require('../schemas/User')
const WithAuth = require('../middlewares/users')

userRoutes.post('/login', async (req, res) => {
    if (!req.session.login) {
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
                        req.session.login = user._id
                        res.status(200).json(
                            {
                                message: 'user logged in successfully',
                                user: { name: user.name, email: user.email, id: user._id, decks: user.decks, victories: user.victories },
                            }
                        )
                    }
                })
            }
        } catch (error) {
            res.status(500).json({ error })
        }
    } else {
        res.status(401).json({ error: 'user already logged in' })
    }
})
userRoutes.get('/logout', async (req, res) => {
    req.session.login = null
    res.status(200).json({ message: 'logged out' })
})

userRoutes.post('/register', async (req, res) => {
    if (!req.session.login) {
        const checkEmail = await User.findOne({ email: req.body.email })
        if (!checkEmail) {
            try {
                const hashedPassword = await bcrypt.hash(req.body.password, 10)
                const user = new User({
                    name: req.body.name,
                    email: req.body.email,
                    password: hashedPassword,
                    victories: 0,
                })
                await user.save()
                res.status(201).json({ success: true, message: 'User saved successfully' })
            } catch (error) {
                res.json(error)
            }
        } else {
            res.status(401)
                .json({ error: 'this email already exists' })
        }
    } else {
        res.status(401).json({ error: 'user already logged in' })
    }
})

userRoutes.put('/update', WithAuth, async (req, res) => {
    const { newName, newEmail, newPassword, password } = req.body;
    const id = req.session.login
    let user = await User.findById(id)
    if (!user) {
        res.status(401).json({ error: 'user not found' })
    } else {
        user.isCorrectPassword(password, async (err, same) => {
            if (!same) {
                res.status(401).json({ error: 'incorrect password' })
            } else {

                if (newPassword) {
                    const hashedPassword = await bcrypt.hash(newPassword, 10)
                    user.password = hashedPassword
                }
                if (newEmail) {
                    user.email = newEmail
                }
                if (newName) {
                    user.name = newName
                }
                await user.save()
                res.status(200).json({ user: { name: user.name, email: user.email, id: user._id, decks: user.decks } })
            }
        })
    }
})
userRoutes.delete('/delete', WithAuth, async (req, res) => {
    const { password } = req.body;
    const id = req.session.login
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