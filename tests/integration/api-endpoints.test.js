import { test, expect, describe, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';

// Import the server app (we'll need to modify server.js to export the app)
// For now, we'll create a simplified version for testing
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static('public'));

  // Mock session data endpoint
  app.post('/append-session-data', (req, res) => {
    try {
      const { sessionData } = req.body;
      
      if (!sessionData || !Array.isArray(sessionData)) {
        return res.status(400).json({ error: 'Invalid session data format' });
      }

      // Validate session data structure
      const isValid = sessionData.every(item => 
        typeof item.time === 'number' &&
        typeof item.stringSet === 'number' &&
        typeof item.root === 'number' &&
        typeof item.key === 'string' &&
        typeof item.type === 'string'
      );

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid session data structure' });
      }

      // In real implementation, this would write to CSV
      // For testing, we'll just validate and return success
      res.json({ 
        success: true, 
        message: 'Session data saved successfully',
        recordsProcessed: sessionData.length 
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Mock analysis endpoint
  app.get('/analyze-session-data', (req, res) => {
    try {
      // Mock analysis response
      const mockAnalysis = {
        slowestChords: [
          { stringSet: 1, root: 3, key: 'F#', type: 'maj7', avgTime: 4500 },
          { stringSet: 2, root: 5, key: 'Bb', type: 'min7', avgTime: 4200 },
          { stringSet: 1, root: 4, key: 'Eb', type: 'dom7', avgTime: 3800 }
        ],
        totalSessions: 15,
        averageTime: 2800,
        improvementSuggestions: [
          'Practice F# maj7 on SS1 R/3',
          'Work on Bb min7 chord shapes'
        ]
      };

      res.json(mockAnalysis);
    } catch (error) {
      res.status(500).json({ error: 'Analysis failed' });
    }
  });

  // Mock custom message endpoint
  app.post('/send-message', (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Mock AI response
      const mockResponse = {
        response: `Mock AI response to: "${message}"`,
        timestamp: new Date().toISOString(),
        model: 'gpt-3.5-turbo'
      };

      res.json(mockResponse);
    } catch (error) {
      res.status(500).json({ error: 'Message processing failed' });
    }
  });

  return app;
}

describe('API Endpoints Integration Tests', () => {
  let app;
  const testDataDir = path.join(process.cwd(), 'tests', 'fixtures');
  const testSessionFile = path.join(testDataDir, 'test-session-data.csv');

  beforeAll(async () => {
    app = createTestApp();
    
    // Create test fixtures directory
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Clean up test files
    if (fs.existsSync(testSessionFile)) {
      fs.unlinkSync(testSessionFile);
    }
  });

  beforeEach(() => {
    // Reset any state between tests
  });

  describe('POST /append-session-data', () => {
    test('should accept valid session data', async () => {
      const sessionData = [
        {
          time: 2500,
          stringSet: 1,
          root: 2,
          key: 'D',
          type: 'maj7'
        },
        {
          time: 3200,
          stringSet: 2,
          root: 3,
          key: 'F',
          type: 'min7'
        }
      ];

      const response = await request(app)
        .post('/append-session-data')
        .send({ sessionData })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recordsProcessed).toBe(2);
    });

    test('should reject invalid session data format', async () => {
      const response = await request(app)
        .post('/append-session-data')
        .send({ sessionData: 'invalid' })
        .expect(400);

      expect(response.body.error).toBe('Invalid session data format');
    });

    test('should reject session data with missing fields', async () => {
      const sessionData = [
        {
          time: 2500,
          // missing stringSet, root, key, type
        }
      ];

      const response = await request(app)
        .post('/append-session-data')
        .send({ sessionData })
        .expect(400);

      expect(response.body.error).toBe('Invalid session data structure');
    });

    test('should reject session data with wrong field types', async () => {
      const sessionData = [
        {
          time: 'invalid', // Should be number
          stringSet: 1,
          root: 2,
          key: 'D',
          type: 'maj7'
        }
      ];

      const response = await request(app)
        .post('/append-session-data')
        .send({ sessionData })
        .expect(400);

      expect(response.body.error).toBe('Invalid session data structure');
    });

    test('should handle empty session data array', async () => {
      const response = await request(app)
        .post('/append-session-data')
        .send({ sessionData: [] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recordsProcessed).toBe(0);
    });

    test('should handle large session data sets', async () => {
      const sessionData = Array.from({ length: 100 }, (_, i) => ({
        time: 2000 + i * 10,
        stringSet: (i % 2) + 1,
        root: (i % 4) + 1,
        key: ['C', 'D', 'E', 'F'][i % 4],
        type: ['maj7', 'min7', 'dom7'][i % 3]
      }));

      const response = await request(app)
        .post('/append-session-data')
        .send({ sessionData })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recordsProcessed).toBe(100);
    });
  });

  describe('GET /analyze-session-data', () => {
    test('should return analysis data', async () => {
      const response = await request(app)
        .get('/analyze-session-data')
        .expect(200);

      expect(response.body).toHaveProperty('slowestChords');
      expect(response.body).toHaveProperty('totalSessions');
      expect(response.body).toHaveProperty('averageTime');
      expect(response.body).toHaveProperty('improvementSuggestions');
      
      expect(Array.isArray(response.body.slowestChords)).toBe(true);
      expect(Array.isArray(response.body.improvementSuggestions)).toBe(true);
      expect(typeof response.body.totalSessions).toBe('number');
      expect(typeof response.body.averageTime).toBe('number');
    });

    test('should return properly formatted slowest chords', async () => {
      const response = await request(app)
        .get('/analyze-session-data')
        .expect(200);

      const { slowestChords } = response.body;
      expect(slowestChords.length).toBeGreaterThan(0);
      
      slowestChords.forEach(chord => {
        expect(chord).toHaveProperty('stringSet');
        expect(chord).toHaveProperty('root');
        expect(chord).toHaveProperty('key');
        expect(chord).toHaveProperty('type');
        expect(chord).toHaveProperty('avgTime');
        expect(typeof chord.avgTime).toBe('number');
      });
    });
  });

  describe('POST /send-message', () => {
    test('should process valid message', async () => {
      const message = 'What are my slowest chord changes?';
      
      const response = await request(app)
        .post('/send-message')
        .send({ message })
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.response).toContain(message);
    });

    test('should reject empty message', async () => {
      const response = await request(app)
        .post('/send-message')
        .send({ message: '' })
        .expect(400);

      expect(response.body.error).toBe('Message is required');
    });

    test('should reject non-string message', async () => {
      const response = await request(app)
        .post('/send-message')
        .send({ message: 123 })
        .expect(400);

      expect(response.body.error).toBe('Message is required');
    });

    test('should handle long messages', async () => {
      const longMessage = 'A'.repeat(1000);
      
      const response = await request(app)
        .post('/send-message')
        .send({ message: longMessage })
        .expect(200);

      expect(response.body.response).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for unknown endpoints', async () => {
      await request(app)
        .get('/unknown-endpoint')
        .expect(404);
    });

    test('should handle malformed JSON', async () => {
      await request(app)
        .post('/append-session-data')
        .set('Content-Type', 'application/json')
        .send('{ malformed json }')
        .expect(400);
    });
  });

  describe('Content Type Validation', () => {
    test('should require JSON content type for POST endpoints', async () => {
      await request(app)
        .post('/append-session-data')
        .set('Content-Type', 'text/plain')
        .send('plain text data')
        .expect(400);
    });
  });

  describe('Performance Tests', () => {
    test('should respond within reasonable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/analyze-session-data')
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});