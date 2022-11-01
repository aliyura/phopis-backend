import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CartonDetailDto {
  @IsString() serialNumber: string;
  @IsString() picture: string;
}

export class ResourceOwnershipProofDto {
  @IsOptional() receipt: string;
  @IsOptional() legalDocuments: any[];
}

export class ResourceLocationDetailDto {
  @IsOptional() lga: string;
  @IsOptional() state: string;
  @IsOptional() address: string;
  @IsOptional() landmark: string;
}

export class ResourceDto {
  @IsString() name: string;
  @IsString() identityNumber: string;
  @IsString() type: string;
  @IsOptional() model: string;
  @IsOptional() color: string;
  @IsOptional() description: string;
  @IsOptional() carton: boolean;
  @IsOptional() cartonDetail: CartonDetailDto;
  @IsOptional() category: string;
  @IsOptional() picture: string;
  @IsOptional() ownershipProof: ResourceOwnershipProofDto;
  @IsOptional() size: string;
  @IsOptional() locationDetail: ResourceLocationDetailDto;
  @IsOptional() witnesses: any[];
  @IsOptional() ownedDate: string;
}

export class UpdateResourceDto {
  @IsOptional() name: string;
  @IsOptional() model: string;
  @IsOptional() color: string;
  @IsOptional() description: string;
}

export class VerifyResourceDto {
  @IsNumber() resourceNumber: number;
  @IsNumber() ownerAccountNumber: number;
  @IsString() ownerIdentity: string;
}

export class ResourceStatusUpdateDto {
  @IsOptional() reason: string;
  @IsOptional() description: string;
}

export class ResourceOwnershipChangeDto {
  @IsOptional() newOwner: string;
  @IsOptional() description: string;
}
