// utils/generateToken.js
// -----------------------------------------------------------------------
// Signs a JWT for a given user id and sets it as an httpOnly cookie so it
// works seamlessly with both the server-rendered pages and the JSON API.
// -----------------------------------------------------------------------
const jwt = require('jsonwebtoken');

function generateToken(res, userId) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });

  const days = Number(process.env.JWT_COOKIE_EXPIRES_DAYS || 30);

  res.cookie('token', token, {
    httpOnly: true, // not accessible via client-side JS (XSS protection)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  });

  return token;
}

module.exports = generateToken;
