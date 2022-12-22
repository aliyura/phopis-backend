import { IsNumber, IsOptional, IsString } from 'class-validator';

export class BuyUnitDto {
  txRef: string;
  flwRef: string;
  currency: string;
  status: string;
  IP: string;
  channel: string;
  amount: number;
  customer: any;
  createdAt: string;
}
export class FundUnitDto {
  accountId: string;
  unitAddress: string;
  paymentRef: string;
  transactionId: number;
  channel: string;
  amount: number;
}

export class DebitUnitDto {
  @IsString() address: string;
  @IsString() transactionId: string;
  @IsString() channel: string;
  @IsNumber() amount: number;
  @IsOptional() narration: string;
}
export class UnitTransferDto {
  @IsString() recipient: string;
  @IsOptional() narration: string;
  @IsNumber() amount: number;
}

export class WithdrawalRequestDto {
  @IsString() accountNumber: string;
  @IsString() accountName: string;
  @IsString() accountType: string;
  @IsNumber() amount: number;
}

export class WithdrawalStatusDto {
  @IsString() requestId: string;
  @IsString() status: string;
  @IsString() reason: string;
}
export class UnitLogDto {
  @IsString() uuid: string;
  @IsString() activity: string;
  @IsNumber() amount: number;
  @IsString() status: number;
  @IsString() ref: number;
  @IsString() channel: number;
}
