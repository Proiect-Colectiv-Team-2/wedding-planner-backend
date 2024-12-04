const jwt = require('jsonwebtoken');

module.exports = (requiredRole) => {
    return (req, res, next) => {
        if (req.method === 'OPTIONS') {
            return next();
        }

        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Authentication failed: Authorization header missing or incorrectly formatted.' });
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json({ message: 'Authentication failed: Token not found.' });
            }

            jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
                if (err) {
                    const message = err.name === 'JsonWebTokenError'
                        ? 'Authentication failed: Invalid token format.'
                        : 'Authentication failed: Token verification error.';
                    return res.status(403).json({ message });
                }

                if (requiredRole && user.role !== requiredRole) {
                    return res.status(403).json({ message: 'Access Denied' });
                }

                req.user = user;
                next();
            });

        } catch (err) {
            return res.status(500).json({ message: 'Internal server error.' });
        }
    };
};
