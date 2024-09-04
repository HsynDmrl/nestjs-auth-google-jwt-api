import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
import { Request, Response } from 'express';
import * as moment from 'moment';
  
  @Catch()
  export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
  
      const status = exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
  
      const message = exception instanceof HttpException
        ? exception.getResponse()
        : 'Sunucu hatası';
  
      response.status(status).json({
        statusCode: status,
        timestamp: moment().format('DD-MM-YYYY HH:mm:ss'),
        error: HttpStatus[status], 
        path: request.url,
        message: typeof message === 'string' ? message : message['message'],
      });
    }
  }
  