import mongoose from "mongoose";

import {Roles} from '../constants.js';

const usersSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: false
  },
  lastName: {
    type: String,
    required: false
  },
  age: {
    type: Number,
    min: [18, "Users must be adults"],
    required: false
  },
  email: {   
    type: String,
    required: true,
    unique: true,
    trim: true,// 'asd@o2.pl ' -> 'asd@o2.pl'
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    min: [3, "Password must be at least 3 characters long"]
  },
  role: {
    type: String,
    enum: [Roles.ADMIN, Roles.USER],
    default: Roles.USER
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default usersSchema;