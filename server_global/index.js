const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());

// Database Connection
const dbURI = process.env.MONGODB_URI;
if (!dbURI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Basic Route
app.get('/', (req, res) => {
  res.send('Global Server is running!');
});

// Import and use API routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// TODO: Import and use API routes for users, animals, etc.

app.listen(port, () => {
  console.log(`Global server is listening on port ${port}`);
});

module.exports = app; // For testing purposes
