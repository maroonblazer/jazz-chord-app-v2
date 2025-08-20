// START THE SERVER WITH `node server-refactored.js`
import path from 'path';
import express from 'express';
import fs from 'fs';
import cors from 'cors';
// import { query } from './qa.js';
import csvParser from 'csv-parser';
import { Database } from './database/Database.js';

const app = express();

app.use(cors());
app.use(express.json()); // for parsing application/json

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(process.cwd(), 'public')));

// Initialize database
const db = new Database();
let currentSessionId = null;

// Define routes first
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public/index.html'));
});

// Enhanced endpoint to handle data from the client
app.post('/append-session-data', async (req, res) => {
  try {
    const { data } = req.body; // Assuming data is an array of objects
    
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

// Database wipe endpoint - requires confirmation
app.post('/wipe-database', async (req, res) => {
  try {
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

// Initialize database and start server
async function startServer() {
  try {
    await db.init();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log('Using refactored architecture with database layer');
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await db.close();
  process.exit(0);
});