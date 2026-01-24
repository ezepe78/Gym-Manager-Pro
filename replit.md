# Boutique Gym Manager Pro

## Overview
A React-based gym management application with features for managing students, schedules, finances, and more. Built with Vite, React 19, TypeScript, and Tailwind CSS.

## Project Structure
- `/` - Root contains main React components and configuration
- `/components` - Reusable UI components
- `/context` - React context providers for state management
- `/pages` - Page-level components (Dashboard, Agenda, Students, Finances, Settings)

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS (via CDN)
- **Charts**: Recharts
- **Icons**: Lucide React

## Development
- Run `npm run dev` to start the development server on port 5000
- Run `npm run build` to build for production

## Environment Variables
- `GEMINI_API_KEY` - Optional API key for AI features (if used)

## Deployment
Configured for static deployment. Build outputs to `dist/` directory.
