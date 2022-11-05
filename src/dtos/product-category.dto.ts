import { IsOptional } from 'class-validator';

export class ProductCategoryDto {
  @IsOptional() title: string;
  @IsOptional() description: string;
}
