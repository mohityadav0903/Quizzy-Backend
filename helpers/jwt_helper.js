const JWT = require('jsonwebtoken');
const createError = require('http-errors');


const signAccessToken = (user) => {
    return new Promise((resolve, reject) => {
        const payload = {
            id : user._id,
            email : user.email,
            name : user.name,
            role : user.role
        };
        const secret = process.env.JWT_SECRET;
        const options = {
            expiresIn : '30d'
        }
        JWT.sign(payload, secret, options, (err, token) => {
            if(err) {
                console.log(err.message);
                reject(createError.InternalServerError());
            }
            resolve(token);
        });
    });
}
const signEmailToken = (user) => {
    return new Promise((resolve, reject) => {
        const payload = {
            id : user._id,
            email : user.email,
            role : user.role
        };
        const secret = process.env.JWT_SECRET;
        const options = {
            expiresIn : '30d'
        }
        JWT.sign(payload, secret, options, (err, token) => {
            if(err) {
                console.log(err.message);
                reject(createError.InternalServerError());
            }
            resolve(token);
        });
    });
}

const verifyAccessToken = (token) => {
    return new Promise((resolve, reject) => {
        JWT.verify(token, process.env.JWT_SECRET,(err,payload)=>{
            if(err){
                console.log(err.message);
                const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message;
                reject(createError.Unauthorized(message));
            }
            resolve(payload);
        })

    })
}

module.exports = {
    signAccessToken,
    signEmailToken,
    verifyAccessToken
}
