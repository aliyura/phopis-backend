import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BusinessDto {
  @IsString() businessName: string;
  @IsEmail() email: string;
  @IsNotEmpty() phone: string;
  @IsString() state: string;
  @IsNotEmpty() lga: string;
  @IsOptional() address: string;
  @IsOptional() identityType: string;
  @IsOptional() identityNumber: string;
  @IsOptional() businessId: string;
  @IsNotEmpty() logo: string;
}
export class BusinessBodyDto {
  @IsString() businessName: string;
  @IsNotEmpty() name: string;
  @IsEmail() email: string;
  @IsNotEmpty() phone: string;
  @IsNotEmpty() password: string;
  @IsString() state: string;
  @IsNotEmpty() lga: string;
  @IsOptional() address: string;
  @IsOptional() identityType: string;
  @IsOptional() identityNumber: string;
  @IsOptional() businessId: string;
  @IsNotEmpty() logo: string;
}
