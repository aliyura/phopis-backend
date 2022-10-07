import { IsOptional, IsString } from 'class-validator';

export class CartonDetailDto {
  @IsString() serialNumber: string;
  @IsString() picture: string;
}

export class ResourceDto {
  @IsString() name: string;
  @IsString() model: string;
  @IsString() color: string;
  @IsOptional() description: string;
  @IsString() identityNumber: string;
  @IsOptional() carton: boolean;
  @IsOptional() cartonDetail: CartonDetailDto;
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
  @IsOptional() date: Date;
  @IsOptional() area: string;
  @IsOptional() description: string;
}

export class ResourceOwnershipChangeDto {
  @IsOptional() currentOwner: string;
  @IsOptional() newOwner: string;
  @IsOptional() description: string;
}
