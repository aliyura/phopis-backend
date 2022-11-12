import { IsNumber, IsOptional, IsString, IsUppercase } from 'class-validator';

export class ServiceDto {
  @IsString() title: string;
  @IsString() @IsUppercase() type: string;
  @IsOptional() charges: number;
  @IsNumber() revenue: number;
  @IsOptional() description: string;
}

export class UpdateServiceDto {
  @IsOptional() title: string;
  @IsOptional() charges: number;
  @IsOptional() revenue: number;
  @IsOptional() description: string;
}
