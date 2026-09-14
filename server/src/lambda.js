import serverless from 'serverless-http';
import app from './app.js';

// Handler exportado para Netlify Functions
export const handler = serverless(app);
