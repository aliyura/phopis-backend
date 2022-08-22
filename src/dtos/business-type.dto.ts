import { IsOptional, IsString } from 'class-validator';

export class BusinessTypeDto {
  @IsString() title: string;
  @IsOptional() description: string;
}
