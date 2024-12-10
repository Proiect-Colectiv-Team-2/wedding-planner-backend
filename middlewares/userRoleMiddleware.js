const jwt = require('jsonwebtoken');

module.exports = (allowedRoles) => {
    return (req, res, next) => {
        if (req.method === 'OPTIONS') {
            return next();
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Forbidden.'
            });
        }
        next();
    };
};