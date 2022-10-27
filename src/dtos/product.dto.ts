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
  @IsString() @IsUppercase() category: string;
  @IsNumber() price: number;
  @IsString() @IsUppercase() size: string;
  @IsOptional() quantity: number;
  @IsOptional() description: string;
}

export class UpdateProductDto {
  @IsString() title: string;
  @IsNumber() price: number;
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
  @IsOptional() description: string;
}

export class ProductAdjustDto {
  @IsString() operation: string;
  @IsNumber() quantity: number;
  @IsOptional() reason: string;
}
