const hapi = require('hapi');
const mongoose = require('mongoose');
const path = require('path');
const _ = require('lodash');

const config = require(path.resolve('config/config'));

mongoose.connect(config.databaseUrl);

require(path.resolve('./models/users'));

const User = mongoose.model('User');

const init = async () => {
    // Create a server with a host and port
    const server = hapi.server({
        port: 3000
    });

    await server.register(require('hapi-auth-jwt2'));

    server.auth.strategy('jwt', 'jwt',
        {
            key: config.jwtKey,
            validate: async function (decoded, request) {
                try {
                    const user = await User
                        .findOne({email: decoded.email})
                        .exec();
                    if (!user) {
                        return {isValid: false};
                    }
                    request.user = user;
                    return {isValid: true};
                } catch (e) {
                    return {isValid: false};
                }
            },
            verifyOptions: {algorithms: ['HS256']}
        });

    server.auth.default('jwt');


    const authenticationRoutes = require(path.resolve('routes/LoginRegister'));

    // Add the routes
    server.route(authenticationRoutes);

    await server.start();
    return server;
};


init().then(server => {
    console.log('Server running at:', server.info.uri);
}).catch(error => {
    console.log(error);
});