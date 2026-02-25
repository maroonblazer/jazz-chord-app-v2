// START THE SERVER WITH `node server.js`
import path from 'path';
import express from 'express';
import cors from 'cors';
// import { query } from './qa.js';
import { Database } from './database/Database.js';

const app = express();

app.use(cors());
app.use(express.json()); // for parsing application/json

// Lightweight safeguard: restrict destructive endpoints to localhost
function localhostOnly(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  if (!isLocal) {
    return res.status(403).json({ success: false, message: 'This endpoint is only available from localhost' });
  }
  next();
}

// Simple in-memory rate limiter for destructive endpoints (1 request per 5 seconds)
const rateLimitMap = new Map();
function rateLimit(windowMs = 5000) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const lastRequest = rateLimitMap.get(key) || 0;
    if (now - lastRequest < windowMs) {
      return res.status(429).json({ success: false, message: 'Too many requests. Please wait before trying again.' });
    }
    rateLimitMap.set(key, now);
    next();
  };
}

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(process.cwd(), 'public')));

// Initialize database
const DB_PATH = process.env.DB_PATH
  ? process.env.DB_PATH
  : path.join(process.cwd(), 'data', 'jazz-chords.db');
const db = new Database(DB_PATH);

let isDatabaseInitialized = false;

async function initializeDatabase() {
  if (!isDatabaseInitialized) {
    await db.init();
    isDatabaseInitialized = true;
  }
}

// Input validation for session result entries
const VALID_STRING_SETS = ['1', '2'];
const VALID_ROOTS = ['1', '2', '3', '4', '5'];
const VALID_KEYS = [
  'C', 'D', 'E', 'F', 'G', 'A', 'B',
  'C#', 'D#', 'F#', 'G#', 'A#',
  'Db', 'Eb', 'Gb', 'Ab', 'Bb'
];
const VALID_QUALITIES = [
  'maj7', 'min7', 'dom7', 'min7b5',
  'alt dom', 'maj9', 'min9', 'dom13'
];

function validateSessionEntry(entry, index) {
  const errors = [];
  if (!VALID_STRING_SETS.includes(String(entry.stringSet))) {
    errors.push(`[${index}] invalid stringSet: ${entry.stringSet}`);
  }
  if (!VALID_ROOTS.includes(String(entry.root))) {
    errors.push(`[${index}] invalid root: ${entry.root}`);
  }
  if (!VALID_KEYS.includes(entry.key)) {
    errors.push(`[${index}] invalid key: ${entry.key}`);
  }
  if (!VALID_QUALITIES.includes(entry.quality)) {
    errors.push(`[${index}] invalid quality: ${entry.quality}`);
  }
  const time = parseFloat(entry.time);
  if (isNaN(time) || time < 0 || time > 300) {
    errors.push(`[${index}] invalid time (must be 0-300s): ${entry.time}`);
  }
  if (entry.date && isNaN(Date.parse(entry.date))) {
    errors.push(`[${index}] invalid date: ${entry.date}`);
  }
  return errors;
}

// Define routes first
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public/index.html'));
});

// Enhanced endpoint to handle data from the client
app.post('/append-session-data', async (req, res) => {
  try {
    await initializeDatabase();
    const { data } = req.body;
    
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: 'Request body must contain a non-empty "data" array' });
    }
    if (data.length > 100) {
      return res.status(400).json({ message: 'Too many results in a single request (max 100)' });
    }
    
    // Validate each entry
    const allErrors = data.flatMap((entry, i) => validateSessionEntry(entry, i));
    if (allErrors.length > 0) {
      return res.status(400).json({ message: 'Validation errors', errors: allErrors });
    }
    
    console.log('Received session data:', data.length, 'results');
    
    // Create new session
    const sessionId = await db.createSession({
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
    
    // Add all results to the session
    await db.addSessionResults(sessionId, data);
    
    // Complete the session
    await db.completeSession(sessionId, data.length);
    
    console.log(`Session ${sessionId} completed with ${data.length} results`);
    
    res.status(200).json({
      message: 'Session data stored successfully',
      sessionId: sessionId,
      resultsCount: data.length
    });
    
  } catch (error) {
    console.error('Error storing session data:', error);
    res.status(500).json({ 
      message: 'Error storing session data',
      error: error.message 
    });
  }
});

// Enhanced analysis endpoint using database queries
app.get('/analyze-session-data', async (req, res) => {
  try {
    await initializeDatabase();
    const results = await db.getWorstPerformingChords(3);
    
    console.log('Analysis results:', results);
    
    res.json({ 
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error analyzing session data:', error);
    res.status(500).json({ 
      error: 'Failed to analyze session data',
      message: error.message
    });
  }
});

// New endpoint for performance summary
app.get('/performance-summary', async (req, res) => {
  try {
    await initializeDatabase();
    const summary = await db.getPerformanceSummary();
    const stats = await db.getSessionStats();
    
    res.json({
      summary,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting performance summary:', error);
    res.status(500).json({ 
      error: 'Failed to get performance summary',
      message: error.message 
    });
  }
});

// Export data as CSV (backward compatibility)
app.get('/export-csv', async (req, res) => {
  try {
    await initializeDatabase();
    const csvData = await db.exportToCSV();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="jazz-chords-data.csv"');
    res.send(csvData);
    
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ 
      error: 'Failed to export CSV',
      message: error.message 
    });
  }
});

// Legacy CSV endpoint for backward compatibility
app.post('/get-assistant-feedback', async (req, res) => {
  console.log('Received Post request for assistant feedback (legacy endpoint)');
  try {
    await initializeDatabase();
    const recentResults = await db.getRecentSessionResults(10);
    
    // Convert to legacy format if needed
    const legacyFormat = recentResults.map(result => ({
      ss: result.string_set,
      root: result.root,
      key: result.key_signature,
      quality: result.chord_type,
      time: result.solve_time_seconds,
      date: result.created_at
    }));
    
    res.json(legacyFormat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error querying data' });
  }
});

app.post('/send-message', async (req, res) => {
  console.log('Received Post request for follow-up feedback...');
  try {
    await initializeDatabase();
    const question = req.body.message;
    console.log('Question from client:', question);
    
    // For now, return a simple response since AI features are commented out
    const response = {
      answer: `I received your question: "${question}". The AI analysis features are currently being refactored to work with the new database system.`,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing message' });
  }
});

// Database wipe endpoint - localhost only, rate-limited, requires confirmation
app.post('/wipe-database', localhostOnly, rateLimit(5000), async (req, res) => {
  try {
    await initializeDatabase();
    const { confirmation } = req.body;
    
    // Require exact confirmation text for safety
    if (confirmation !== 'DELETE ALL MY DATA') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid confirmation. Type exactly: DELETE ALL MY DATA' 
      });
    }
    
    console.log('Database wipe requested with valid confirmation');
    const result = await db.wipeAllData();
    
    res.json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to wipe database:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to wipe database: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await initializeDatabase();
    const stats = await db.getSessionStats();
    res.json({
      status: 'healthy',
      database: 'connected',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

let serverInstance = null;

async function startServer(port = PORT) {
  await initializeDatabase();

  if (serverInstance) {
    return serverInstance;
  }

  return new Promise((resolve, reject) => {
    serverInstance = app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
      console.log('Using refactored architecture with database layer');
      resolve(serverInstance);
    });

    serverInstance.on('error', (err) => {
      serverInstance = null;
      reject(err);
    });
  });
}

async function stopServer() {
  if (!serverInstance) {
    return;
  }

  await new Promise((resolve, reject) => {
    serverInstance.close((err) => {
      if (err) {
        reject(err);
      } else {
        serverInstance = null;
        resolve();
      }
    });
  });
}

async function closeDatabase() {
  if (isDatabaseInitialized) {
    await db.close();
    isDatabaseInitialized = false;
  }
}

if (!process.env.JAZZ_DISABLE_AUTO_LISTEN) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    await stopServer();
    await closeDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export { app, startServer, stopServer, initializeDatabase, closeDatabase, db };
