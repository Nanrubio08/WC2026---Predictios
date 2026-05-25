import { CorsOptions } from 'cors';

const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
  throw new Error('FRONTEND_URL environment variable is required — refusing to start with wildcard CORS');
}

export const corsOptions: CorsOptions = {
  origin: frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-token'],
  credentials: true,
};
