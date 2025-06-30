import jwt from 'jsonwebtoken';

export default function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //console.log("decoded code: ", decoded);
    // Attach decoded data to the request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
    console.log('🧠 Authenticated User:', req.user);
    next();
  } catch (err) {
    console.error('❌ JWT Error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}