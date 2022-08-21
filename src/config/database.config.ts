import { registerAs } from '@nestjs/config';

const baseUrl = `${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}`;
const dbUrl = `mongodb+srv://${baseUrl}`;

export default registerAs('database', () => ({
  dbUrl,
}));
