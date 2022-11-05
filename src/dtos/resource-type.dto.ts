import { IsOptional } from 'class-validator';

export class ResourceTypeDto {
  @IsOptional() title: string;
  @IsOptional() description: string;
}
