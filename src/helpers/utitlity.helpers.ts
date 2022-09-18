import { HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse } from '../dtos/ApiResponse.dto';
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
  static success(content: any, message: string): ApiResponse {
    const data = {
      success: true,
      message,
      data: content,
    } as ApiResponse;
    return data;
  }

  /**
   * Sends error resonse to client
   * @param {*} content
   * @param {*} message
   * @param {*} status
   */
  static error(message: string, status: string | HttpStatus): ApiResponse {
    const data = {
      success: false,
      message,
      data: {},
    } as ApiResponse;

    throw new HttpException(data, HttpStatus[status]);
  }

  /**
   * Axios wrapper for get requests
   * @param {string} path
   * @param queryParam
   * @param headers
   * @returns {Promise<T>}
   */
  static get<T>(
    path: string,
    queryParam: { [key: string]: string | number | boolean },
    headers: { [key: string]: string | number | boolean },
  ): Promise<T> {
    return axios
      .get<T>(path, {
        params: queryParam,
        headers,
      })
      .then((res) => res.data);
  }

  /**
   * Axios wrapper for post requests
   * @param {string} path
   * @param data
   * @param queryParam
   * @param headers
   * @returns {Promise<T>}
   */
  static post<T>(
    path: string,
    data: any,
    queryParam?: { [key: string]: string | number | boolean },
    headers?: { [key: string]: string | number | boolean },
  ): Promise<T> {
    return axios
      .post<T>(path, {
        params: queryParam,
        headers,
        data,
      })
      .then((res) => res.data);
  }
  /**
   * Axios wrapper for post requests
   * @param {string} path
   * @param data
   * @param queryParam
   * @param headers
   * @returns {Promise<T>}
   */
  static put<T>(
    path: string,
    data: any,
    queryParam?: { [key: string]: string | number | boolean },
    headers?: { [key: string]: string | number | boolean },
  ): Promise<T> {
    return axios
      .put<T>(path, {
        params: queryParam,
        headers,
        data,
      })
      .then((res) => res.data);
  }

  static getUniqueId(): Promise<string> {
    const id = uuidv4();
    const uid = id.split('-').join('');
    return uid.substring(0, 11).toLowerCase();
  }

  static getCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static validNin(nin: string): boolean {
    if (nin.length < 11 || nin.length > 11) return false;
    if (!nin.match(/^[0-9]+$/)) return false;
    return true;
  }

  static validPhoneNumber(phoneNumber: string): boolean {
    const result = phoneNumber.match(/^[0-9]+$/);
    if (result && phoneNumber.length == 11) {
      return true;
    }
    return false;
  }
}
