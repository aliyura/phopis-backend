import { IsOptional } from 'class-validator';

export class ProductSizeDto {
  @IsOptional() title: string;
  @IsOptional() description: string;
}
