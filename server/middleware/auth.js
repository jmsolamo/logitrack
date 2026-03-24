import admin from 'firebase-admin';

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('AUTH ERROR: Token verification strictly failed:', error);
    return res.status(401).json({ message: 'Unauthorized', error: error.message });
  }
};

export default verifyToken;
