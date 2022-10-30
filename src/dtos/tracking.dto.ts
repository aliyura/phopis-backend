import { IsOptional, IsString } from 'class-validator';

export class TrackingRequestDto {
  @IsString() resourceId: string;
  @IsString() missingReason: string;
  @IsString() missingDate: string;
  @IsString() missingArea: string;
  @IsOptional() description: string;
}

export class TrackingStatusChangeDto {
  @IsString() status: string;
  @IsString() reason: string;
}
