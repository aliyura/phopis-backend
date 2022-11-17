import { registerAs } from '@nestjs/config';

const baseUrl = `${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}`;
const dbUrl = `mongodb://${baseUrl}`;

console.log('database:', dbUrl);

export default registerAs('database', () => ({
  dbUrl,
}));
