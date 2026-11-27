// Import jsonwebtoken for creating and verifying JWT authentication tokens
import jwt from 'jsonwebtoken';

// Create a scoped constant for the JWT signing secret
const JWT_SECRET = process.env.JWT_SECRET || 'studyapp-secret-key-change-me';

// Authenticate requests using a Bearer JWT and add the user to the request
export function authMiddleware(req, res, next) {
  try {
    // Create a scoped constant for the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    // Create scoped constants for the token and decoded user identity
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.userId, username: decoded.username };
    next();
  } catch (err) {
    // Report and reject invalid or expired authentication tokens
    console.error('Auth error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Generate a signed JWT for an authenticated user
export function generateToken(userId, username) {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
}
