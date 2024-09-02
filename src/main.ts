import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Interceptor olarak kullanabilir bütün request ve response'ları loglayabiliriz.
  // app.useGlobalInterceptors(app.get(AuditLogInterceptor));

  // app.use(helmet());
  // app.enableCors();

  // Swagger yapılandırması
  const config = new DocumentBuilder()
    .setTitle('Soru Cevap')
    .setDescription('Soru Cevap API')
    .setVersion('1.0')
    .addTag('API')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}

bootstrap();


