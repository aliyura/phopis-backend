import { HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse } from '../dtos/ApiResponse.dto';
import { Messages } from '../utils/messages/messages';
import * as formatCurrency from 'format-currency';
import * as fs from 'fs';
import { AwesomeQR } from 'awesome-qr';
import { join } from 'path';
import { FileService } from 'src/services/file/file.service';

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

  static success(content: any): ApiResponse {
    const data = {
      success: true,
      message: Messages.RequestSuccessful,
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
  static convertToMoney(num: number): number {
    const opts = { format: '%v %c' };
    return formatCurrency(num, opts);
  }

  static validNin(nin: string): boolean {
    if (nin.length < 11 || nin.length > 11) return false;
    if (!nin.match(/^[0-9]+$/)) return false;
    return true;
  }
  static async generateQR(value: string): Promise<ApiResponse> {
    try {
      const fileService = new FileService();
      const background = fs.readFileSync(
        join(process.cwd(), './public/logo.jpg'),
      );
      const buffer = await new AwesomeQR({
        text: value,
        size: 500,
        backgroundImage: background,
      }).draw();

      const response = await fileService.uploadBuffer(buffer);
      console.log(response);
      if (response.success) {
        const data = response.data;
        return this.success(data.url);
      }
      return this.fail('Unable to upload QR code');
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
}
