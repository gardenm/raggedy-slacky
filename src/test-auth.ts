// Simple script to generate a JWT token for testing
// This bypasses bcrypt by using a direct token generation

import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';

// Create a JWT token directly (bypassing bcrypt)
const payload = {
  username: 'admin',
  sub: 1, // user ID
};

const secret = process.env.JWT_SECRET || 'dev_secret_not_for_production';
const token = jwt.sign(payload, secret, { expiresIn: '1d' });

console.log('Generated JWT token for testing:');
console.log(token);

// Write to a file for easy access
fs.writeFileSync('test-token.txt', token);
console.log('Token also saved to test-token.txt');