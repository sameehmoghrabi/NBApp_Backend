const hapi = require('hapi');
const mongoose = require('mongoose');
const joi = require('joi');
const path = require('path');
const Boom = require('boom');
const jwt = require('jsonwebtoken');

const jwt_key = "thisIsMyDummyJwtKey";

mongoose.connect('mongodb://localhost:27017/NBApp');

require(path.resolve('./models/users'));

const User = mongoose.model('User');

const Utils = require(path.resolve('./utils/utils'));

// Create a server with a host and port
const server = hapi.server({
    port: 3000
});

// Add the route
server.route([{
        method: 'POST',
        path: '/register',
        config: {
            validate: {
                payload: {
                    name: joi.string().min(4).required(),
                    email: joi.string().email().required(),
                    password: joi.string().required()
                }
            }
        },
        handler: async function (request, h) {
            try {
                const newUser = new User(request.payload);
                const result = await newUser.save();
                return Utils.sanitizeUser(result);
            } catch (e) {
                return Boom.badRequest(e.message);
            }
        }

    },
    {
        method: 'POST',
        path: '/login',
        config: {
            validate: {
                payload: {
                    email: joi.string().email().required(),
                    password: joi.string().required()
                }
            }
        },
        handler: async function (req, h) {
            const user = await User.findOne({
                email: req.payload.email
            }).exec();
            if (!user) {
                return Boom.badRequest('bad username and/or password');
            }
            const hashedPassword = user.hashPassword(req.payload.password);
            if (hashedPassword !== user.password) {
                return Boom.badRequest('bad username and/or password');
            }
            const sanitizedUser = Utils.sanitizeUser(user);
            var token = jwt.sign(sanitizedUser, jwt_key);
            sanitizedUser.token = token;
            return sanitizedUser;

        }

    }
]);


// Start the server
async function start() {

    try {
        await server.start();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};

start();