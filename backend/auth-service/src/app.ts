import 'dotenv/config';
import { validateEnv } from './config/env';
validateEnv();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { corsOptions } from './config/cors';
import healthRouter from './routes/health';
import authRouter from './routes/authRoutes';
import internalUsersRouter from './routes/internalUsersRoutes';
import adminUsersRouter from './routes/adminUsersRoutes';
import adminInviteCodesRouter from './routes/adminInviteCodesRoutes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';

const app = express();
app.set('trust proxy', 1); // trust Nginx reverse proxy for X-Forwarded-For
const PORT = process.env.PORT ?? 3001;

app.use(cors(corsOptions));
app.use(express.json({ limit: '12mb' }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css' }));

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin/invite-codes', adminInviteCodesRouter);
app.use('/internal/users', internalUsersRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`auth-service running on port ${PORT}`);
});

export default app;
