import { IsOptional } from 'class-validator';

export class ProductTypeDto {
  @IsOptional() title: string;
  @IsOptional() description: string;
}
