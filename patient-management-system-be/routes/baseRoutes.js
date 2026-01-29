import express from 'express';
import {testBase} from '../controllers/baseTestController.js';

const baseRoutes = express.Router();
baseRoutes.get('/test', testBase);

export default baseRoutes;