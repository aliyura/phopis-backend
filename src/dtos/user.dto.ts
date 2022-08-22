import { IsOptional, IsString, IsUppercase } from 'class-validator';

export class UserDto {
  @IsString() name: string;
  @IsString() type: string;
  @IsString() phone: string;
  @IsString() email: string;
  @IsOptional() @IsString() state: string;
  @IsOptional() @IsString() lga: string;
  @IsOptional() @IsString() street: string;
  @IsOptional() @IsString() regNumber: string;
  @IsString() @IsUppercase() target: string;
  @IsString() password: string;
}

export class UserUpdateDto {
  @IsOptional() name: string;
  @IsOptional() type: string;
  @IsOptional() phone: string;
  @IsOptional() email: string;
  @IsOptional() state: string;
  @IsOptional() lga: string;
  @IsOptional() street: string;
  @IsOptional() regNumber: string;
  @IsString() target: string;
}

export class UserAuthDto {
  @IsString() username: string;
  @IsString() password: string;
}
