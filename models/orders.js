import mongoose from 'mongoose';

import ordersSchema from "../schemas/orders.js";
import {Collections} from '../constants.js'

const Orders = mongoose.model(Collections.ORDERS, ordersSchema);

export default Orders;