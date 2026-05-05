const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const { jwtSecret, jwtExpiresIn, bcryptRounds } = require('../config');
const store = require('../data/store');
const authenticate = require('../middleware/auth');

const router = express.Router();

const signupSchema = Joi.object({
    name: Joi.string().min(1).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    preferences: Joi.array().items(Joi.string()).default([]),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const preferencesSchema = Joi.object({
    preferences: Joi.array().items(Joi.string()).required(),
});

router.post('/signup', async (req, res, next) => {
    try {
        const { value, error } = signupSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        if (store.getUserByEmail(value.email)) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(value.password, bcryptRounds);
        store.createUser({
            name: value.name,
            email: value.email,
            passwordHash,
            preferences: value.preferences,
        });

        return res.status(200).json({ message: 'User registered successfully' });
    } catch (err) {
        next(err);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { value, error } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const user = store.getUserByEmail(value.email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const ok = await bcrypt.compare(value.password, user.passwordHash);
        if (!ok) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ email: user.email }, jwtSecret, { expiresIn: jwtExpiresIn });
        return res.status(200).json({ token });
    } catch (err) {
        next(err);
    }
});

router.get('/preferences', authenticate, (req, res) => {
    const user = store.getUserByEmail(req.user.email);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ preferences: user.preferences });
});

router.put('/preferences', authenticate, (req, res) => {
    const { value, error } = preferencesSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const updated = store.updatePreferences(req.user.email, value.preferences);
    if (!updated) {
        return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ preferences: updated.preferences });
});

module.exports = router;
