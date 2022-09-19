import { IsOptional, IsString } from 'class-validator';

export class ResourceTypeDto {
  @IsString() title: string;
  @IsOptional() description: string;
}
