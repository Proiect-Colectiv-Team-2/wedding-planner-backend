const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Allow OPTIONS requests through without authentication
    if (req.method === 'OPTIONS') {
        return next();
    }

    try {
        // Check if authorization header is present
        if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
            throw new Error('Authentication failed: Authorization header missing or incorrectly formatted.');
        }

        // Extract the token from the authorization header
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            throw new Error('Authentication failed: Token not found.');
        }

        // Verify and decode the token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.userData = {
            userId: decodedToken.userId,
        };
        next();

    } catch (err) {
        // Check for JWT-specific error messages
        const message = err.name === 'JsonWebTokenError' ? 'Authentication failed: invalid token format.' : err.message;
        return res.status(401).json({ message });
    }
};
