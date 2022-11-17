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
import { BusinessTypeController } from './api/v1/business-type/business-type.controller';
import { BusinessTypeService } from './services/business-type/business-type.service';
import {
  BusinessType,
  BusinessTypeSchema,
} from './schemas/business-type.schema';
import { ResourceController } from './api/v1/resource/resource.controller';
import { ResourceService } from './services/resource/resource.service';
import { Resource, ResourceSchema } from './schemas/resource.schema';
import { SmsService } from './services/sms/sms.service';
import { ProductCategoryController } from './api/v1/product-category/product-category.controller';
import { ProductCategoryService } from './services/product-category/product-category.service';
import {
  ProductCategory,
  ProductCategorySchema,
} from './schemas/product-category.schema';
import { VerificationService } from './services/verification/verification.service';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { WalletService } from './services/wallet/wallet.service';
import { WalletController } from './api/v1/wallet/wallet.controller';
import { AppController } from './api/v1/app/app.controller';
import { LogsService } from 'src/services/logs/logs.service';
import { WalletLog, WalletLogSchema } from './schemas/wallet-logs.schema';
import { FileService } from './services/file/file.service';
import { FileController } from './api/v1/file/file.controller';
import {
  ResourceOwnershipLog,
  ResourceOwnershipLogSchema,
} from './schemas/resource-ownership-logs.schema';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductType, ProductTypeSchema } from './schemas/product-type.schema';
import { ProductTypeService } from './services/product-type/product-type.service';
import { ProductTypeController } from './api/v1/product-type/product-type.controller';
import { ProductController } from './api/v1/product/product.controller';
import { ProductService } from './services/product/product.service';
import { ProductSizeService } from './services/product-size/product-size.service';
import { ProductSizeController } from './api/v1/product-size/product-size.controller';
import { ProductSize, ProductSizeSchema } from './schemas/product-size.schema';
import { SaleService } from './services/sale/sale.service';
import { SaleController } from './api/v1/sale/sale.controller';
import { Sale, SaleSchema } from './schemas/sale-chema';
import { ReportController } from './api/v1/report/report.controller';
import { ReportService } from './services/report/report.service';
import { TrackingService } from './services/tracking/tracking.service';
import { TrackingController } from './api/v1/tracking/tracking.controller';
import { Tracking, TrackingSchema } from './schemas/tracking.schema';
import { BranchController } from './api/v1/branch/branch.controller';
import { ResourceTypeController } from './api/v1/resource-type/resource-type.controller';
import { ResourceTypeService } from './services/resource-type/resource-type.service';
import { Service, ServiceSchema } from './schemas/service.schema';
import { ServiceType, ServiceTypeSchema } from './schemas/service-type.schema';
import { ServiceTypeController } from './api/v1/service-type/service-type.controller';
import { ServiceController } from './api/v1/service/service.controller';
import { ServiceTypeService } from './services/service-type/service-type.service';
import { ServiceService } from './services/service/service.service';
import {
  ResourceType,
  ResourceTypeSchema,
} from './schemas/resource-type.schema';
@Module({
  imports: [
    MongooseModule.forRoot(process.env.DB_ADDRESS),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: BusinessType.name, schema: BusinessTypeSchema },
    ]),
    MongooseModule.forFeature([
      { name: ProductCategory.name, schema: ProductCategorySchema },
    ]),
    MongooseModule.forFeature([
      { name: Resource.name, schema: ResourceSchema },
    ]),
    MongooseModule.forFeature([
      { name: Tracking.name, schema: TrackingSchema },
    ]),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([
      { name: ProductType.name, schema: ProductTypeSchema },
    ]),
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
    MongooseModule.forFeature([
      { name: ServiceType.name, schema: ServiceTypeSchema },
    ]),
    MongooseModule.forFeature([
      { name: ProductSize.name, schema: ProductSizeSchema },
    ]),
    MongooseModule.forFeature([
      { name: ResourceType.name, schema: ResourceTypeSchema },
    ]),
    MongooseModule.forFeature([
      { name: ResourceOwnershipLog.name, schema: ResourceOwnershipLogSchema },
    ]),
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    MongooseModule.forFeature([
      { name: WalletLog.name, schema: WalletLogSchema },
    ]),

    MongooseModule.forFeature([{ name: Sale.name, schema: SaleSchema }]),
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
    ProductCategoryController,
    WalletController,
    AppController,
    FileController,
    ProductTypeController,
    ProductSizeController,
    ResourceTypeController,
    ProductController,
    SaleController,
    ReportController,
    TrackingController,
    BranchController,
    ServiceTypeController,
    ServiceController,
  ],
  providers: [
    UserService,
    AuthService,
    AuthStrategy,
    CryptoService,
    BusinessTypeService,
    ResourceService,
    SmsService,
    ProductCategoryService,
    ProductTypeService,
    ProductSizeService,
    ResourceTypeService,
    ProductService,
    VerificationService,
    WalletService,
    LogsService,
    FileService,
    SaleService,
    ReportService,
    TrackingService,
    ServiceTypeService,
    ServiceService,
  ],
})
export class AppModule {}
