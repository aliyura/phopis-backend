import { IsOptional } from 'class-validator';

export class ServiceTypeDto {
  @IsOptional() title: string;
  @IsOptional() description: string;
}
