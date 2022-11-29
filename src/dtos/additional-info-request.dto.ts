import { IsOptional, IsString, IsUppercase } from 'class-validator';

export class AdditionalInfoRequest {
  @IsString() @IsUppercase() key: string;
  @IsOptional() value: any;
}
