import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { HttpStatus } from 'src/enums/http.status';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const success = false;
    let status, resObj, data, message;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      resObj = exception.getResponse();
      (message = resObj.message), (data = resObj.data || {});
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      resObj = exception;
      message = 'Sorry, we are unable to process your request';
      data = {
        message: resObj.message,
        stack: resObj.stack,
      };
    }
    return response.status(status).json({ success, message, data });
  }
}
