import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class SaleProductsDto {
  @IsString() productId: string;
  @IsNumber() quantity: number;
}
export class TransactionServicesDto {
  @IsString() serviceId: string;
  @IsNumber() quantity: number;
}

export class SaleDto {
  @IsOptional() customerAccountCode: string;
  @IsOptional() customerName: string;
  @IsOptional() customerPhoneNumber: string;
  @IsOptional() discount: number;
  @IsArray() products: SaleProductsDto[];
}
export class TransactionDto {
  @IsOptional() customerAccountCode: string;
  @IsOptional() customerName: string;
  @IsOptional() customerPhoneNumber: string;
  @IsOptional() discount: number;
  @IsArray() services: TransactionServicesDto[];
}
