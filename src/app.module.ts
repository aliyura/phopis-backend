import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import config from './config/config';
import databaseConfig from './config/database.config';
import { User, UserSchema } from './schemas/user.schema';
import { UserService } from './services/user/user.service';
import { AuthService } from './services/auth/auth.service';
import { UserController } from './api/v1/user/user.controller';
import { AuthController } from './api/v1/auth/auth.controller';
import { CryptoService } from './services/crypto/crypto.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthStrategy } from './services/auth/auth.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config, databaseConfig],
    }),
    MongooseModule.forRoot(databaseConfig().dbUrl, {
      dbName: process.env.DB_NAME,
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({
      secret: process.env.APP_SECRET,
      signOptions: { expiresIn: '100s' },
    }),
    PassportModule,
  ],
  controllers: [UserController, AuthController],
  providers: [UserService, AuthService, AuthStrategy, CryptoService],
})
export class AppModule {}
