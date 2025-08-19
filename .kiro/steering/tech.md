# Technology Stack

## Frontend

- **Vanilla JavaScript (ES6 modules)** - Client-side application logic
- **HTML5 & CSS3** - UI structure and styling with CSS Grid/Flexbox
- **SVG** - Dynamic fretboard diagrams and chord visualizations
- **Web APIs** - Fetch API for server communication, Clipboard API for copy functionality

## Backend

- **Node.js** - Server runtime
- **Express.js** - Web framework and API server
- **File System (fs)** - CSV data persistence
- **CORS** - Cross-origin resource sharing

## Testing

- **Playwright** - End-to-end testing framework
- **TypeScript** - Test file typing (playwright.config.ts)

## Dependencies

- **csv-parser** - CSV file processing
- **dotenv** - Environment variable management
- **svg-sprite** - SVG sprite generation (unused in current implementation)

## Common Commands

```bash
# Start development server
npm start

# Run end-to-end tests
npx playwright test

# Generate SVG sprites (if needed)
npm run create-sprite
```

## Architecture Notes

- Client-server architecture with REST API endpoints
- Session data stored in CSV files (session-data.csv, session-data-last-10.csv)
- SVG chord diagrams generated dynamically in JavaScript
- State management handled with vanilla JavaScript (SessionState enum)
