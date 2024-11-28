import mongoose from 'mongoose';

import itemsSchema from "../schemas/items.js";
import {Collections} from '../constants.js'

const Items = mongoose.model(Collections.ITEMS, itemsSchema);

export default Items;