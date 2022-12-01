import { IsOptional, IsString } from 'class-validator';

export class UserDto {
  @IsString() name: string;
  @IsString() accountType: string;
  @IsString() phoneNumber: string;
  @IsOptional() @IsString() businessType: string;
  @IsOptional() @IsString() state: string;
  @IsOptional() @IsString() lga: string;
  @IsOptional() @IsString() address: string;
  @IsOptional() @IsString() regNumber: string;
  @IsOptional() @IsString() nin: string;
  @IsOptional() @IsString() businessTarget: string;
  @IsString() password: string;
  @IsOptional() @IsString() role: string;
}

export class BusinessUserDto {
  @IsString() name: string;
  @IsString() phoneNumber: string;
  @IsOptional() @IsString() state: string;
  @IsOptional() @IsString() lga: string;
  @IsOptional() @IsString() address: string;
  @IsString() @IsString() nin: string;
  @IsString() password: string;
}

export class UserBranchDto {
  @IsString() name: string;
  @IsString() phoneNumber: string;
  @IsOptional() @IsString() state: string;
  @IsOptional() @IsString() lga: string;
  @IsOptional() @IsString() address: string;
  @IsString() password: string;
}

export class ValidateUserDto {
  @IsString() username: string;
}
export class VerifyUserDto {
  @IsString() username: string;
  @IsString() otp: string;
}

export class ResetPasswordDto {
  @IsString() username: string;
  @IsString() password: string;
  @IsString() otp: string;
}

export class AuthUserDto {
  @IsString() username: string;
  @IsString() sub: string;
}

export class UserUpdateDto {
  @IsOptional() name: string;
  @IsOptional() alias: string;
  @IsOptional() primaryColor: string;
  @IsOptional() secondaryColor: string;
  @IsOptional() description: string;
  @IsOptional() address: string;
  @IsOptional() dp: string;
}

export class UserAuthDto {
  @IsString() username: string;
  @IsString() password: string;
}

export class UserSubscriptionDto {
  @IsString() startDate: string;
  @IsString() endDate: string;
}

export class ContactDetail {
  @IsOptional() id: string;
  @IsOptional() key: string;
  @IsOptional() value: string;
}
export class ServiceDetail {
  @IsOptional() id: string;
  @IsOptional() title: string;
  @IsOptional() description: string;
  @IsOptional() image: string;
}

export class ProductDetail {
  @IsOptional() id: string;
  @IsOptional() title: string;
  @IsOptional() description: string;
  @IsOptional() price: number;
  @IsOptional() image: string;
}

export class ReviewDetail {
  @IsOptional() id: string;
  @IsOptional() name: string;
  @IsOptional() rate: number;
  @IsOptional() description: string;
}
export class AdditionalInfoDto {
  @IsOptional() primaryColor: string;
  @IsOptional() secondaryColor: string;
  @IsOptional() logo: string;
  @IsOptional() description: string;
  @IsOptional() services: ServiceDetail[];
  @IsOptional() contacts: ContactDetail[];
  @IsOptional() keywords: string[];
  @IsOptional() products: ProductDetail[];
  @IsOptional() reviews: ReviewDetail[];
  @IsOptional() visits: number;
}
