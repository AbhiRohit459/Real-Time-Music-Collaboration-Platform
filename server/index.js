const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const projectRoutes = require('./routes/projects');
const exportRoutes = require('./routes/export');
const aiRoutes = require('./routes/ai');

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MongoDB connection
let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/spotmies_ai';
// Clean up the connection string (remove any quotes, trim whitespace, remove variable name if accidentally included)
mongoUri = mongoUri.trim().replace(/^["']|["']$/g, ''); // Remove surrounding quotes
if (mongoUri.startsWith('MONGODB_URI=')) {
  mongoUri = mongoUri.replace(/^MONGODB_URI=/, ''); // Remove variable name if included
}
console.log('Attempting to connect to MongoDB...');

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000, // 45 seconds
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('Database:', mongoose.connection.db.databaseName);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('Connection URI:', mongoUri.replace(/:[^:@]+@/, ':****@')); // Hide password in logs
  if (err.name === 'MongoServerSelectionError') {
    console.error('💡 Tip: Check your MongoDB Atlas IP whitelist and network access settings');
  }
});

// MongoDB connection event handlers
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

// Socket.io connection handling
const socketHandler = require('./socket/handler');
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

