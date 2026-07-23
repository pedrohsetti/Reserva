const dotenv = require('dotenv');

dotenv.config();

const required = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const parsePort = (value) => {
  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer');
  }

  return port;
};

const env = {
  PORT: parsePort(process.env.PORT || 5000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: required('MONGODB_URI'),
  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
};

if (!['development', 'production', 'test'].includes(env.NODE_ENV)) {
  throw new Error('NODE_ENV must be development, production, or test');
}

if (!env.MONGODB_URI.startsWith('mongodb')) {
  throw new Error('MONGODB_URI must be a valid MongoDB URI');
}

module.exports = env;
