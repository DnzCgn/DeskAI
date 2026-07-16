const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticator } = require('otplib');

const SALT_ROUNDS = 12;

function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function generateMFASecret(email) {
  return authenticator.generateSecret();
}

function generateMFAUri(email, secret) {
  return authenticator.keyuri(email, 'DESKA', secret);
}

function verifyMFAToken(secret, token) {
  return authenticator.check(token, secret);
}

module.exports = {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  generateMFASecret,
  generateMFAUri,
  verifyMFAToken,
};
