import { HttpException } from '@nestjs/common';
import axios from 'axios';
import { HttpStatus } from 'src/enums/http.status';
import { v4 as uuidv4 } from 'uuid';
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
  static success(content: any, message: string): any {
    const data = {
      success: true,
      message,
      data: content,
    };
    return data;
  }

  /**
   * Sends error resonse to client
   * @param {*} content
   * @param {*} message
   * @param {*} status
   */
  static error(message: string, status: string | HttpStatus): Response {
    const data = {
      success: false,
      message,
      data: {},
    };

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
    const businessId = id.split('-').join('');
    return businessId.substring(0, 11);
  }
}
