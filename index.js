import express from 'express';
import mongoose from 'mongoose';

import UsersRouter from './routes/users.js';
import ItemsRouter from './routes/items.js';
import OrdersRouter from './routes/orders.js';
import { logger } from './middleware/logger.js';

const PORT = 3000;
const DATABASE_URL = 'mongodb://localhost:27017/zad1';

const server = express();

server.use(logger);

server.get('/', (req, res) => {
    res.send('Hello world!');
});

server.use(express.json());
server.use('/users', UsersRouter);
server.use('/items', ItemsRouter);
server.use('/orders', OrdersRouter);
server.listen(PORT, async () => {
    console.log(`Server listens on port ${PORT}`);
    try {
        await mongoose.connect(DATABASE_URL);
        console.log(`Database connected at URL ${DATABASE_URL}`);
    } catch (error) {
        console.log(error);
    }
})