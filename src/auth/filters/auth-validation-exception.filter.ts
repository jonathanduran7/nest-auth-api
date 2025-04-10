import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class AuthValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const isValidationError =
      typeof exceptionResponse === 'object' &&
      Array.isArray((exceptionResponse as any).message);

    if (isValidationError) {
      response.status(status).json({
        statusCode: status,
        error: 'Bad Request',
        message: 'Password or email is not valid',
      });
    } else {
      response.status(status).json(exceptionResponse);
    }
  }
}
