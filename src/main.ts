import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as morgan from 'morgan';
import { createStream } from 'rotating-file-stream';
import * as path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './helpers';
import coreConfig from './config/config';
import { join } from 'path';

async function bootstrap() {
  const CONFIG = coreConfig();

  // create a rotating write stream
  const accessLogStream = createStream('access.log', {
    interval: '1d', // rotate daily
    path: path.join(path.dirname(__dirname), 'log'),
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('v1');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  // setup the logger
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    index: false,
    prefix: '/public',
  });
  app.use(morgan('combined', { stream: accessLogStream }));
  app.use(morgan('combined'));
  app.use(compression());
  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: 1000, // 15 minutes
      max: 10000, // limit each IP to 100 requests per windowMs
    }),
  );
  //TODO: there is a load balancer or reverse proxy. Express may need to be configured to trust the headers set by the proxy in order to get the correct IP for the end user
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.enableCors();

  try {
    // quit on ctrl-c when running docker in terminal
    process.on('SIGINT', () => {
      console.info(
        'Got SIGINT (aka ctrl-c in docker). Graceful shutdown ',
        new Date().toISOString(),
      );
      app.close();
    });

    // quit properly on docker stop
    process.on('SIGTERM', () => {
      console.info(
        'Got SIGTERM (docker container stop). Graceful shutdown ',
        new Date().toISOString(),
      );
      app.close();
    });
  } catch (e) {
    console.error(e);
  }
  console.log('Running on port: ' + CONFIG.port);
  await app.listen(CONFIG.port);
}
bootstrap();
