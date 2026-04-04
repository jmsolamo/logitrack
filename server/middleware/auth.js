<<<<<<< HEAD
import jwt from 'jsonwebtoken';
=======
import admin from 'firebase-admin';
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

<<<<<<< HEAD
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('AUTH ERROR: Token verification failed:', error.message);
=======
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('AUTH ERROR: Token verification strictly failed:', error);
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
    return res.status(401).json({ message: 'Unauthorized', error: error.message });
  }
};

export default verifyToken;
