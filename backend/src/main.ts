import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { DomainExceptionFilter } from "./shared/http/filters/domain-exception.filter";
import { createRequestValidationPipe } from "./shared/http/pipes/request-validation-options";
import { ForbiddenException } from "@nestjs/common";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const allowedOrigin = process.env.CORS || "http://localhost:5173";

  app.enableCors({
    origin: (origin, callback) => {
      if (origin === allowedOrigin) {
        callback(null, true);
        return;
      }
      callback(new ForbiddenException("CORS origin not allowed"), false);
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type, Accept, Authorization, Idempotency-Key",
    credentials: true,
  });
  app.useGlobalPipes(createRequestValidationPipe());
  app.useGlobalFilters(new DomainExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle("Bauk Transfer API")
    .setDescription("API de transferências internas entre usuários")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
