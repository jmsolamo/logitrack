import admin from '../config/firebase.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('AUTH ERROR: Missing or improperly formatted Authorization header:', authHeader);
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      console.error('AUTH ERROR: Token extraction failed from header');
      return res.status(401).json({ message: 'Token extraction failed' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('AUTH ERROR: Token verification strictly failed:', error);
    return res.status(401).json({ message: 'Invalid token', error: error.message, stack: error.stack });
  }
};
