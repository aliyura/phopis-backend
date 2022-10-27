import { IsOptional } from 'class-validator';

export class ResourceCategoryDto {
  @IsOptional() title: string;
  @IsOptional() description: string;
}
