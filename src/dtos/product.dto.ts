import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUppercase,
} from 'class-validator';

export class ProductDto {
  @IsString() title: string;
  @IsString() @IsUppercase() type: string;
  @IsOptional() purchasePrice: number;
  @IsNumber() sellingPrice: number;
  @IsString() @IsUppercase() size: string;
  @IsOptional() quantity: number;
  @IsOptional() description: string;
}

export class UpdateProductDto {
  @IsOptional() title: string;
  @IsOptional() sellingPrice: number;
  @IsOptional() purchasePrice: number;
  @IsOptional() description: string;
}

export class SaleDto {
  @IsOptional() customerAccountCode: string;
  @IsOptional() customerName: string;
  @IsOptional() customerPhoneNumber: string;
  @IsArray() products: any[];
}

export class ProductUploadDto {
  @IsOptional() title: string;
  @IsNumber() quantity: number;
  @IsNumber() sellingPrice: number;
  @IsOptional() purchasePrice: number;
  @IsOptional() description: string;
}

export class ProductAdjustDto {
  @IsString() operation: string;
  @IsNumber() quantity: number;
  @IsOptional() reason: string;
}
