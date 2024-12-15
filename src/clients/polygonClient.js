import { restClient } from '@polygon.io/client-js';
import dotenv from 'dotenv';

dotenv.config();

const polygonClient = restClient(process.env.POLYGON_API_KEY);

console.log("Polygon.io client initialized");

export { polygonClient };
