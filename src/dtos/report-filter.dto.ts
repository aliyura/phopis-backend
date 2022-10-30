import { IsOptional } from 'class-validator';

export class FilterDto {
  @IsOptional() from: string;
  @IsOptional() to: string;
}
