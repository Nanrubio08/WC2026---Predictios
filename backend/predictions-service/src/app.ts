import 'dotenv/config';
import { validateEnv } from './config/env';
validateEnv();
import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors';
import healthRouter from './routes/health';
import internalUsersRouter from './routes/internalUsersRoutes';
import internalPredictionsRouter from './routes/internalPredictionsRoutes';
import internalScoringRouter from './routes/internalScoringRoutes';
import predictionsRouter from './routes/predictionsRoutes';
import leaderboardRouter from './routes/leaderboardRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3003;

app.use(cors(corsOptions));
app.use(express.json());

app.use('/health', healthRouter);
app.use('/internal/users', internalUsersRouter);
app.use('/internal/predictions', internalPredictionsRouter);
app.use('/internal/scoring', internalScoringRouter);
app.use('/api/predictions', predictionsRouter);
app.use('/api/leaderboard', leaderboardRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`predictions-service running on port ${PORT}`);
});

export default app;
