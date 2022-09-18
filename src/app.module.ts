import { CacheModule, Module } from '@nestjs/common';
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
import { BusinessTypeController } from './api/v1/business-type/business-type.controller';
import { BusinessTypeService } from './services/business-type/business-type.service';
import {
  BusinessType,
  BusinessTypeSchema,
} from './schemas/business-type.schema';
import { ResourceController } from './api/v1/resource/resource.controller';
import { ResourceService } from './services/resource/resource.service';
import { Resource, ResourceSchema } from './schemas/resource.schema';

@Module({
  imports: [
    CacheModule.register(),
    ConfigModule.forRoot({
      load: [config, databaseConfig],
    }),
    MongooseModule.forRoot(databaseConfig().dbUrl, {
      dbName: process.env.DB_NAME,
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: BusinessType.name, schema: BusinessTypeSchema },
    ]),
    MongooseModule.forFeature([
      { name: Resource.name, schema: ResourceSchema },
    ]),
    JwtModule.register({
      secret: process.env.APP_SECRET,
      signOptions: { expiresIn: '10000s' },
    }),
    PassportModule,
  ],
  controllers: [
    UserController,
    AuthController,
    BusinessTypeController,
    ResourceController,
  ],
  providers: [
    UserService,
    AuthService,
    AuthStrategy,
    CryptoService,
    BusinessTypeService,
    ResourceService,
  ],
})
export class AppModule {}
