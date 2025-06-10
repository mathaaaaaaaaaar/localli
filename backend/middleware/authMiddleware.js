import jwt from 'jsonwebtoken';

export default function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Missing or invalid token');
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(401).send('Invalid or expired token');
  }
}