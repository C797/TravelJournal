import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 500;
    let message = '服务器内部错误';

    if (exception instanceof BusinessException) {
      status = exception.httpStatus;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = status;
      const res = exception.getResponse() as any;
      message = typeof res === 'string' ? res : res?.message || exception.message;
    } else {
      this.logger.error(exception);
    }

    response.status(status).json({
      code,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}
