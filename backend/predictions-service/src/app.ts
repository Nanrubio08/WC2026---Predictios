import 'dotenv/config';
import { validateEnv } from './config/env';
validateEnv();
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { corsOptions } from './config/cors';
import healthRouter from './routes/health';
import internalUsersRouter from './routes/internalUsersRoutes';
import internalPredictionsRouter from './routes/internalPredictionsRoutes';
import internalScoringRouter from './routes/internalScoringRoutes';
import predictionsRouter from './routes/predictionsRoutes';
import leaderboardRouter from './routes/leaderboardRoutes';
import adminLeaderboardRouter from './routes/adminLeaderboardRoutes';
import adminBonusRouter from './routes/adminBonusRoutes';
import adminPredictionsRouter from './routes/adminPredictionsRoutes';
import { myPredictionsRouter } from './routes/myPredictionsRoutes';
import bonusRouter from './routes/bonusRoutes';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';

const app = express();
app.set('trust proxy', 1); // trust Nginx reverse proxy for X-Forwarded-For
const PORT = process.env.PORT ?? 3003;

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

// Rate limiting for predictions (20 per 15 min per IP)
const predictionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Por favor espera antes de volver a intentar.' },
});

// Rate limiting for bonus (5 per min per IP)
const bonusLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Por favor espera.' },
});

app.use('/health', healthRouter);
app.use('/internal/users', internalUsersRouter);
app.use('/internal/predictions', internalPredictionsRouter);
app.use('/internal/scoring', internalScoringRouter);
app.use('/api/predictions', predictionsLimiter, predictionsRouter);
app.use('/api/predictions', myPredictionsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/admin/leaderboard', adminLeaderboardRouter);
app.use('/api/admin/bonus', adminBonusRouter);
app.use('/api/admin/predictions', adminPredictionsRouter);
app.use('/api/bonus', bonusLimiter, bonusRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`predictions-service running on port ${PORT}`);
});

export default app;
