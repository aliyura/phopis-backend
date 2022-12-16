import { IsOptional, IsString, IsNumber } from 'class-validator';

export class ExpenseDto {
  @IsNumber() amount: number;
  @IsString() title: string;
  @IsOptional() description: string;
  @IsOptional() expenseDate: string;
}
export class UpdateExpenseDto {
  @IsOptional() amount: number;
  @IsOptional() title: string;
  @IsOptional() description: string;
  @IsOptional() expenseDate: string;
}
