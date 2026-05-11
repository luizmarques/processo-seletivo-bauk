import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import {
  AuthenticationError,
  ResourceConflictError,
  ResourceNotFoundError,
  ValidationDomainError,
} from "../../domain/errors/domain.errors";

@Catch(
  AuthenticationError,
  ResourceConflictError,
  ResourceNotFoundError,
  ValidationDomainError,
)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse();

    if (exception instanceof AuthenticationError) {
      this.reply(response, HttpStatus.UNAUTHORIZED, {
        message: exception.message,
        error: "Unauthorized",
        statusCode: HttpStatus.UNAUTHORIZED,
      });
      return;
    }
    if (exception instanceof ResourceConflictError) {
      this.reply(response, HttpStatus.CONFLICT, {
        message: exception.message,
        error: "Conflict",
        statusCode: HttpStatus.CONFLICT,
      });
      return;
    }
    if (exception instanceof ResourceNotFoundError) {
      this.reply(response, HttpStatus.NOT_FOUND, {
        message: exception.message,
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
      return;
    }
    if (exception instanceof ValidationDomainError) {
      this.reply(response, HttpStatus.BAD_REQUEST, {
        message: exception.message,
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
      return;
    }

    this.reply(response, HttpStatus.INTERNAL_SERVER_ERROR, {
      message: "Erro interno.",
      error: "Internal Server Error",
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }

  private reply(
    response: {
      status?: (code: number) => {
        json?: (body: unknown) => void;
        send?: (body: unknown) => void;
      };
    } & {
      code?: (code: number) => { send?: (body: unknown) => void };
      send?: (body: unknown) => void;
    },
    statusCode: number,
    body: unknown,
  ): void {
    if (typeof response.status === "function") {
      const result = response.status(statusCode);
      if (typeof result.json === "function") {
        result.json(body);
        return;
      }
      if (typeof result.send === "function") {
        result.send(body);
        return;
      }
    }

    if (typeof response.code === "function") {
      response.code(statusCode).send?.(body);
      return;
    }

    response.send?.(body);
  }
}
