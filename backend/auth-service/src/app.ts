import 'dotenv/config';
import { validateEnv } from './config/env';
validateEnv();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors';
import healthRouter from './routes/health';
import authRouter from './routes/authRoutes';
import internalUsersRouter from './routes/internalUsersRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
app.set('trust proxy', 1); // trust Nginx reverse proxy for X-Forwarded-For
const PORT = process.env.PORT ?? 3001;

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/internal/users', internalUsersRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`auth-service running on port ${PORT}`);
});

export default app;
