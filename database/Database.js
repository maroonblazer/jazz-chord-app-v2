import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

export class Database {
  constructor(dbPath = './data/jazz-chords.db') {
    this.dbPath = dbPath;
    this.db = null;
    this.migrations = [];
  }

  async init() {
    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Open database connection
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await this.db.exec('PRAGMA foreign_keys = ON');
    
    // Run migrations
    await this.runMigrations();
  }

  async runMigrations() {
    // Create migrations table if it doesn't exist
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get executed migrations
    const executedMigrations = await this.db.all(
      'SELECT name FROM migrations ORDER BY id'
    );
    const executedNames = new Set(executedMigrations.map(m => m.name));

    // Define available migrations
    const availableMigrations = [
      {
        name: '001_create_sessions_table',
        up: `
          CREATE TABLE sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            total_iterations INTEGER DEFAULT 0
          )
        `
      },
      {
        name: '002_create_session_results_table',
        up: `
          CREATE TABLE session_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            string_set TEXT NOT NULL,
            root TEXT NOT NULL,
            key_signature TEXT NOT NULL,
            chord_type TEXT NOT NULL,
            solve_time_seconds REAL NOT NULL,
            was_marked_wrong BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
          )
        `
      },
      {
        name: '003_create_performance_view',
        up: `
          CREATE VIEW performance_summary AS
          SELECT 
            string_set || ' R/' || root || ' ' || key_signature || ' ' || chord_type as chord_info,
            AVG(solve_time_seconds) as avg_time,
            COUNT(*) as attempts,
            SUM(CASE WHEN was_marked_wrong THEN 1 ELSE 0 END) as wrong_answers,
            MAX(solve_time_seconds) as max_time,
            MIN(solve_time_seconds) as min_time
          FROM session_results 
          GROUP BY string_set, root, key_signature, chord_type
          ORDER BY avg_time DESC
        `
      },
      {
        name: '004_add_session_metadata',
        up: `
          ALTER TABLE sessions ADD COLUMN metadata TEXT; -- JSON blob for additional data
          CREATE INDEX idx_session_results_session_id ON session_results(session_id);
          CREATE INDEX idx_session_results_chord_info ON session_results(string_set, root, key_signature, chord_type);
          CREATE INDEX idx_session_results_solve_time ON session_results(solve_time_seconds);
        `
      },
      {
        name: '005_fix_performance_view_formatting',
        up: `
          DROP VIEW performance_summary;
          CREATE VIEW performance_summary AS
          SELECT 
            (CASE 
              WHEN string_set LIKE 'SS%' THEN string_set 
              ELSE 'SS' || string_set 
            END || ' ' ||
            CASE 
              WHEN root LIKE 'R/%' THEN root 
              ELSE 'R/' || root 
            END || ' ' || key_signature || ' ' || chord_type) as chord_info,
            AVG(solve_time_seconds) as avg_time,
            COUNT(*) as attempts,
            SUM(CASE WHEN was_marked_wrong THEN 1 ELSE 0 END) as wrong_answers,
            MAX(solve_time_seconds) as max_time,
            MIN(solve_time_seconds) as min_time
          FROM session_results 
          GROUP BY string_set, root, key_signature, chord_type
          ORDER BY avg_time DESC;
        `
      }
    ];

    // Execute pending migrations
    for (const migration of availableMigrations) {
      if (!executedNames.has(migration.name)) {
        console.log(`Running migration: ${migration.name}`);
        
        await this.db.exec('BEGIN TRANSACTION');
        try {
          await this.db.exec(migration.up);
          await this.db.run(
            'INSERT INTO migrations (name) VALUES (?)',
            migration.name
          );
          await this.db.exec('COMMIT');
          console.log(`✓ Migration ${migration.name} completed`);
        } catch (error) {
          await this.db.exec('ROLLBACK');
          console.error(`✗ Migration ${migration.name} failed:`, error);
          throw error;
        }
      }
    }
  }

  async createSession(metadata = {}) {
    const result = await this.db.run(
      'INSERT INTO sessions (metadata) VALUES (?)',
      JSON.stringify(metadata)
    );
    return result.lastID;
  }

  async completeSession(sessionId, totalIterations) {
    await this.db.run(
      'UPDATE sessions SET completed_at = CURRENT_TIMESTAMP, total_iterations = ? WHERE id = ?',
      totalIterations,
      sessionId
    );
  }

  async addSessionResult(sessionId, result) {
    await this.db.run(`
      INSERT INTO session_results 
      (session_id, string_set, root, key_signature, chord_type, solve_time_seconds, was_marked_wrong)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, 
      sessionId,
      result.stringSet,
      result.root,
      result.key,
      result.quality,
      parseFloat(result.time),
      result.wasMarkedWrong || false
    );
  }

  async addSessionResults(sessionId, results) {
    await this.db.exec('BEGIN TRANSACTION');
    try {
      for (const result of results) {
        await this.addSessionResult(sessionId, result);
      }
      await this.db.exec('COMMIT');
    } catch (error) {
      await this.db.exec('ROLLBACK');
      throw error;
    }
  }

  async getRecentSessionResults(limit = 10) {
    return await this.db.all(`
      SELECT 
        string_set,
        root,
        key_signature,
        chord_type,
        solve_time_seconds,
        was_marked_wrong,
        created_at
      FROM session_results 
      ORDER BY created_at DESC 
      LIMIT ?
    `, limit);
  }

  async getWorstPerformingChords(limit = 3) {
    return await this.db.all(`
      SELECT 
        (CASE 
          WHEN string_set LIKE 'SS%' THEN string_set 
          ELSE 'SS' || string_set 
        END || ', ' ||
        CASE 
          WHEN root LIKE 'R/%' THEN root 
          ELSE 'R/' || root 
        END || ', ' || key_signature || ' ' || chord_type) as chordInfo,
        (solve_time_seconds || 's') as timeInfo,
        solve_time_seconds as raw_time
      FROM session_results 
      WHERE solve_time_seconds < 999999  -- Exclude marked wrong answers
      ORDER BY solve_time_seconds DESC 
      LIMIT ?
    `, limit);
  }

  async getPerformanceSummary() {
    return await this.db.all('SELECT * FROM performance_summary LIMIT 10');
  }

  async getAllSessionData() {
    return await this.db.all(`
      SELECT 
        s.id as session_id,
        s.created_at as session_date,
        sr.string_set,
        sr.root,
        sr.key_signature,
        sr.chord_type,
        sr.solve_time_seconds,
        sr.was_marked_wrong
      FROM sessions s
      JOIN session_results sr ON s.id = sr.session_id
      ORDER BY s.created_at DESC, sr.created_at ASC
    `);
  }

  async exportToCSV() {
    const data = await this.getAllSessionData();
    let csvContent = 'SS,Root,Key,Quality,Time,Date\n';
    
    data.forEach(row => {
      csvContent += `${row.string_set},${row.root},${row.key_signature},${row.chord_type},${row.solve_time_seconds},${row.session_date}\n`;
    });
    
    return csvContent;
  }

  async getSessionStats() {
    const stats = await this.db.get(`
      SELECT 
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(sr.id) as total_problems,
        AVG(sr.solve_time_seconds) as avg_solve_time,
        SUM(CASE WHEN sr.was_marked_wrong THEN 1 ELSE 0 END) as wrong_answers
      FROM sessions s
      LEFT JOIN session_results sr ON s.id = sr.session_id
    `);
    return stats;
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}