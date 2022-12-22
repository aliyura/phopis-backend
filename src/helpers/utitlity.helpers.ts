import { HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse } from '../dtos/ApiResponse.dto';
import { Messages } from '../utils/messages/messages';
import * as formatCurrency from 'format-currency';

export type HttpClient = (
  path: string,
  queryParam: { [key: string]: string | number | boolean },
  headers: { [key: string]: string | number | boolean },
) => Promise<unknown>;

export class Helpers {
  /**
   * Sends default JSON resonse to client
   * @param {*} res
   * @param {*} content
   * @param {*} message
   */

  /**
   * Sends error resonse to client
   * @param {*} content
   * @param {*} message
   * @param {*} status
   */
  static failedHttpResponse(message: string, status: HttpStatus): ApiResponse {
    const data = {
      success: false,
      message,
      data: {},
    } as ApiResponse;
    throw new HttpException(data, status);
  }

  static failedHttpResponse2(
    content: any,
    message: string,
    status: HttpStatus,
  ): ApiResponse {
    const data = {
      success: false,
      message,
      data: content,
    } as ApiResponse;
    throw new HttpException(data, status);
  }

  static success(content: any): ApiResponse {
    const data = {
      success: true,
      message: Messages.RequestSuccessful,
      data: content,
    } as ApiResponse;
    return data;
  }

  static failure(content: any, message): ApiResponse {
    const data = {
      success: false,
      message,
      data: content,
    } as ApiResponse;
    return data;
  }

  static fail(message: string): ApiResponse {
    const data = {
      success: false,
      message,
      data: {},
    } as ApiResponse;
    return data;
  }

  static getUniqueId(): Promise<string> {
    const id = uuidv4();
    const uid = id.split('-').join('');
    return uid.substring(0, 11).toLowerCase();
  }

  static getCode(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  static getExtension(filename: string) {
    const i = filename.lastIndexOf('.');
    return i < 0 ? '' : filename.substring(i);
  }
  static convertToMoney(num: number): string {
    const opts = { format: '%v %c' };
    return formatCurrency(num, opts).toString().replace('undefined', '');
  }
  static generateTimestamp(): string {
    return new Date().toISOString().slice(-24).replace(/\D/g, '').slice(0, 14);
  }

  static formatDate(t: Date): string {
    const date = ('0' + t.getDate()).slice(-2);
    const month = ('0' + (t.getMonth() + 1)).slice(-2);
    const year = t.getFullYear();
    return `${year}-${month}-${date}`;
  }

  static formatToNextDay(t: Date): string {
    const date = ('0' + t.getDate()).slice(-2);
    const month = ('0' + (t.getMonth() + 1)).slice(-2);
    const year = t.getFullYear();

    const today = new Date();
    const todayDate = ('0' + today.getDate()).slice(-2);
    let nextDay = date;
    if (date == todayDate) nextDay = (Number(date) + 1).toString();
    return `${year}-${month}-${nextDay}`;
  }
  static validNin(nin: string): boolean {
    if (nin.length < 11 || nin.length > 11) return false;
    if (!nin.match(/^[0-9]+$/)) return false;
    return true;
  }
  static async generateQR(value: string): Promise<ApiResponse> {
    try {
      console.log(value);
      return this.success('http://exanple.com/qr.png');
    } catch (err) {
      console.error(err);
      return this.fail(err);
    }
  }

  static validPhoneNumber(phoneNumber: string): boolean {
    const result = phoneNumber.match(/^[0-9]+$/);
    if (result && phoneNumber.length == 11) {
      return true;
    }
    return false;
  }

  static calculatePOSTransactionCharges(transactionAmount: number): number {
    const charge = 100;
    const count = Math.abs(transactionAmount / 10000);
    const percentage = count.toString().split('.');
    let totalCharge = charge * Number(percentage[0]);
    if (percentage.length > 1) {
      totalCharge = totalCharge + charge;
    }
    return totalCharge;
  }
}
