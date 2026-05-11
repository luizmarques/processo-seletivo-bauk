import {
  BadRequestException,
  ValidationPipe,
  type ValidationPipeOptions,
} from "@nestjs/common";

export const requestValidationOptions: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  stopAtFirstError: true,
  forbidUnknownValues: true,
  transformOptions: {
    enableImplicitConversion: false,
  },
  exceptionFactory: (errors) => {
    const firstConstraint = Object.values(errors[0]?.constraints ?? {})[0];
    return new BadRequestException(
      String(firstConstraint ?? "Payload inválido."),
    );
  },
};

export function createRequestValidationPipe(): ValidationPipe {
  return new ValidationPipe(requestValidationOptions);
}
