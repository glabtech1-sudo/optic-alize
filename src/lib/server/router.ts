import { Router } from 'express';
import aiRouter from './modules/ai/ai.controller';
import storageRouter from './modules/storage/storage.controller';

const apiRouter = Router();

// Register only non-Prisma module routers
apiRouter.use('/', aiRouter);
apiRouter.use('/', storageRouter);

export default apiRouter;
