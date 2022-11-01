import { IsOptional, IsString } from 'class-validator';

export class UserDto {
  @IsOptional() name: string;
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
  @IsOptional() phoneNumber: string;
  @IsOptional() state: string;
  @IsOptional() lga: string;
  @IsOptional() address: string;
  @IsOptional() regNumber: string;
  @IsOptional() businessTarget: string;
}

export class UserAuthDto {
  @IsString() username: string;
  @IsString() password: string;
}

export class UserSubscriptionDto {
  @IsString() startDate: string;
  @IsString() endDate: string;
}
