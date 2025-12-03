# Morning Pulse Website

Modern newspaper website displaying daily news aggregated by Gemini AI.

## Features

- **Dual Mode Operation**:
  - **Mode A**: Real-time Firestore reading (dynamic)
  - **Mode B**: Pre-rendered static JSON files (faster, works offline)

- **Modern Newspaper Design**:
  - Serif typography for headlines (Georgia, Times New Roman)
  - Sans-serif for body text
  - Multi-column responsive layout
  - Category-based color coding
  - Print-friendly styles

- **News Categories**:
  - Local (Zim)
  - Business (Zim)
  - African Focus
  - Global
  - Sports
  - Tech
  - General News

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

1. Install dependencies:
```bash
cd website
npm install
```

2. Set up environment variables (for Firestore mode):
   - Create `.env.local` file
   - Add `VITE_FIREBASE_CONFIG` with your Firebase config JSON (stringified)

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Deployment

The website is automatically deployed to GitHub Pages via GitHub Actions when:
- Changes are pushed to `main` branch
- Daily scheduled build (2 AM UTC)
- Manual workflow trigger

### Manual Deployment

1. Build the website:
```bash
npm run build
```

2. The `dist/` folder contains the static files ready for GitHub Pages

## Configuration

### Firebase Configuration

For real-time mode (Mode A), the website needs Firebase configuration. This can be provided:

1. **Build time**: Set `VITE_FIREBASE_CONFIG` environment variable
2. **Runtime**: Inject `window.__firebase_config` in `index.html`

### Base Path

The website is configured for GitHub Pages with base path `/morning-pulse/`. Update `vite.config.ts` if your repository name differs.

## Architecture

- **React + TypeScript**: Modern frontend framework
- **Vite**: Fast build tool
- **Firebase SDK**: Real-time data reading
- **CSS**: Custom newspaper styling

## Static Generation

The static generation script (`scripts/generateStaticSite.js`) reads news from Firestore and creates JSON files in `dist/data/` for faster loading and offline support.

