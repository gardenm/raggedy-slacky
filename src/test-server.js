// Simple Express server to test JWT token generation
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const port = 3001; // Use 3001 to match Docker port mapping

// Middleware
app.use(bodyParser.json());

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_not_for_production';

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, password });
  
  // Simple validation for demo
  if ((username === 'admin' && password === 'admin123') || 
      (username === 'user' && password === 'password123')) {
    
    // Generate token
    const userId = username === 'admin' ? 1 : 2;
    const token = jwt.sign(
      { username, sub: userId },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    console.log('Generated token:', token);
    
    return res.json({
      access_token: token,
      user: {
        id: userId,
        username,
        email: `${username}@example.com`,
      },
    });
  }
  
  return res.status(401).json({ message: 'Invalid credentials' });
});

// Protected endpoint
app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    return res.json({
      id: decoded.sub,
      username: decoded.username,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Test server is running!');
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running at http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('  POST /api/auth/login - Generate JWT token');
  console.log('  GET /api/auth/me - Verify JWT token');
});