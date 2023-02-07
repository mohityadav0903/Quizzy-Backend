const {verifyAccessToken} = require('../helpers/jwt_helper');
const createError = require('http-errors');
const Admin = require('../models/admin');



const isAdmin = async (req, res, next) => {
    try {
       const {authorization} = req.headers;
         if(!authorization) throw createError.Unauthorized();
         const token = authorization.replace('Bearer ', '');
            const payload = await verifyAccessToken(token);
            if(payload.role !== 'admin') throw createError.Unauthorized();
            const admin = await Admin.findById(payload.id);
            if(!admin) next(createError.Unauthorized());
            req.user  = admin;
            next();
    } catch (error) {
        next(error);
    }
};

module.exports = isAdmin;