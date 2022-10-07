import { IsOptional, IsString, IsUppercase } from 'class-validator';

export class UserDto {
  @IsOptional() name: string;
  @IsString() accountType: string;
  @IsString() phoneNumber: string;
  @IsOptional() @IsString() emailAddress: string;
  @IsOptional() @IsString() businessType: string;
  @IsOptional() @IsString() state: string;
  @IsOptional() @IsString() lga: string;
  @IsOptional() @IsString() street: string;
  @IsOptional() @IsString() regNumber: string;
  @IsOptional() @IsString() nin: string;
  @IsOptional() @IsString() businessTarget: string;
  @IsString() password: string;
}

export class ValidateUserDto {
  @IsString() phoneNumber: string;
}
export class VerifyUserDto {
  @IsString() phoneNumber: string;
  @IsString() otp: string;
}

export class AuthUserDto {
  @IsString() username: string;
  @IsString() sub: string;
}

export class UserUpdateDto {
  @IsOptional() name: string;
  @IsOptional() phoneNumber: string;
  @IsOptional() emailAddress: string;
  @IsOptional() state: string;
  @IsOptional() lga: string;
  @IsOptional() street: string;
  @IsOptional() regNumber: string;
  @IsOptional() businessTarget: string;
}

export class UserAuthDto {
  @IsString() username: string;
  @IsString() password: string;
}
