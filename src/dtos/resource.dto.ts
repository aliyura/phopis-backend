import { IsOptional, IsString } from 'class-validator';

export class ResourceDto {
  @IsString() name: string;
  @IsString() model: string;
  @IsString() color: string;
  @IsOptional() description: string;
  @IsString() identityNumber: string;
  @IsOptional() catton: boolean;
  @IsOptional() cattonSerialNumber: string;
  @IsOptional() cattonPicture: string;
  @IsOptional() type: string;
  @IsString() picture: string;
}

export class UpdateResourceDto {
  @IsOptional() name: string;
  @IsOptional() model: string;
  @IsOptional() color: string;
  @IsOptional() description: string;
}

export class ResourceStatusUpdateDto {
  @IsOptional() statusReason: string;
  @IsOptional() statusChangeDate: Date;
  @IsOptional() statusChangeDescription: string;
}

export class ResourceOwnershipChangeDto {
  @IsOptional() currentOwner: string;
  @IsOptional() newOwner: Date;
  @IsOptional() description: string;
}
