import { Router } from 'express';
import authRouter from './modules/auth/auth.controller';
import companyRouter from './modules/company/company.controller';
import userRouter from './modules/user/user.controller';
import customerRouter from './modules/customer/customer.controller';
import productRouter from './modules/product/product.controller';
import invoiceRouter from './modules/invoice/invoice.controller';
import stockRouter from './modules/stock/stock.controller';
import hrRouter from './modules/hr/hr.controller';
import backupRouter from './modules/backup/backup.controller';
import aiRouter from './modules/ai/ai.controller';
import storageRouter from './modules/storage/storage.controller';

const apiRouter = Router();

// Register Module-Specific routers
apiRouter.use('/auth', authRouter);
apiRouter.use('/', companyRouter);
apiRouter.use('/', userRouter);
apiRouter.use('/', customerRouter);
apiRouter.use('/', productRouter);
apiRouter.use('/', invoiceRouter);
apiRouter.use('/', stockRouter);
apiRouter.use('/', hrRouter);
apiRouter.use('/', backupRouter);
apiRouter.use('/', aiRouter);
apiRouter.use('/', storageRouter);

export default apiRouter;
