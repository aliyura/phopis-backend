import { IsNumber, IsOptional, IsString } from 'class-validator';

export class FundWalletDto {
  @IsString() paymentRef: string;
  @IsString() transactionId: number;
  @IsOptional() channel: string;
  @IsNumber() amount: number;
}

export class FundsTransferDto {
  @IsString() recipient: string;
  @IsOptional() narration: string;
  @IsNumber() amount: number;
}

export class WalletLogDto {
  @IsString() uuid: string;
  @IsString() activity: string;
  @IsNumber() amount: number;
  @IsString() status: number;
  @IsString() ref: number;
  @IsString() channel: number;
}
