import 'dotenv/config';
import { validateEnv } from './config/env';
validateEnv();
import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors';
import healthRouter from './routes/health';
import matchesRouter from './routes/matchesRoutes';
import internalMatchesRouter from './routes/internalMatchesRoutes';
import internalAuditRouter from './routes/internalAuditRoutes';
import adminMatchesRouter from './routes/adminMatchesRoutes';
import { registerSyncFixturesJob } from './jobs/syncFixtures';
import { registerPollLiveMatchesJob } from './jobs/pollLiveMatches';
import { errorHandler } from './middleware/errorHandler';

const app = express();
app.set('trust proxy', 1); // trust Nginx reverse proxy for X-Forwarded-For
const PORT = process.env.PORT ?? 3002;

app.use(cors(corsOptions));
app.use(express.json());

app.use('/health', healthRouter);
app.use('/api/matches', matchesRouter);
app.use('/internal/matches', internalMatchesRouter);
app.use('/internal/audit', internalAuditRouter);
app.use('/api/admin/matches', adminMatchesRouter);

registerSyncFixturesJob();
registerPollLiveMatchesJob();

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`matches-service running on port ${PORT}`);
});

export default app;
