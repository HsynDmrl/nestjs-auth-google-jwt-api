import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Interceptor olarak kullanabilir bütün request ve response'ları loglayabiliriz.
   // app.useGlobalInterceptors(app.get(AuditLogInterceptor));

  await app.listen(3000);
}
bootstrap();

