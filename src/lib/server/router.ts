import { Router } from 'express';
import aiRouter from './modules/ai/ai.controller';
import storageRouter from './modules/storage/storage.controller';
import authRouter from './modules/auth/auth.controller';
import dbRouter from './modules/database/db.controller';

const apiRouter = Router();

// Register only non-Prisma module routers
apiRouter.use('/', aiRouter);
apiRouter.use('/', storageRouter);
apiRouter.use('/', authRouter);
apiRouter.use('/', dbRouter);

export default apiRouter;
