import { IsOptional, IsString, IsNumber } from 'class-validator';

export class DebtDto {
  @IsNumber() amount: number;
  @IsString() debtorName: string;
  @IsString() debtorPhoneNumber: string;
  @IsOptional() description: string;
  @IsOptional() repaymentDate: string;
}
export class UpdateDebtDto {
  @IsOptional() title: string;
  @IsOptional() amount: number;
  @IsOptional() debtorName: string;
  @IsOptional() debtorPhoneNumber: string;
  @IsOptional() description: string;
  @IsOptional() repaymentDate: string;
}
export class DebtRepaymentDto {
  @IsString() duid: string;
  @IsNumber() amount: number;
  @IsOptional() description: string;
}
