# Project Structure

## Root Directory

- **server.js** - Main Express server with API endpoints
- **package.json** - Dependencies and npm scripts
- **playwright.config.ts** - E2E test configuration

## Frontend (`/public`)

- **index.html** - Main HTML file with embedded SVG symbols
- **app.js** - Client-side JavaScript (ES6 module)
- **styles.css** - CSS styling with CSS custom properties
- **favicon.svg** - Site icon

## SVG Assets (`/public/svgs`)

- Chord diagram SVG files organized by string set and root position
- Naming convention: `ss{1|2}-r{1-5}-{major|minor}.svg`
- **backup-svgs/** - Archive of previous chord diagrams

## Testing

- **e2e/** - Playwright end-to-end tests
- **test-results/** - Generated test artifacts
- **playwright-report/** - HTML test reports

## Data Files

- **session-data.csv** - Complete practice session history
- **session-data-last-10.csv** - Most recent session data for analysis

## Development Files

- **scratch.js**, **qa.js**, **openai.js** - Development/experimental scripts
- **tests/** - Additional test files

## Configuration

- **.env** - Environment variables
- **.gitignore** - Git ignore patterns
- **.cursorrules** - IDE-specific rules

## Naming Conventions

- **Chord Data**: String Set (SS1/SS2), Root position (R/1-5), Quality (maj7, min7, dom7, etc.)
- **API Endpoints**: kebab-case (`/append-session-data`, `/analyze-session-data`)
- **CSS Classes**: kebab-case with BEM-like structure
- **JavaScript**: camelCase for variables and functions
