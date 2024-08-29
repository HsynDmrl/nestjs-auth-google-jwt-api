import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as requestIp from 'request-ip';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Interceptor olarak kullanabilir bütün request ve response'ları loglayabiliriz.
   // app.useGlobalInterceptors(app.get(AuditLogInterceptor));

  app.use(requestIp.mw());  // request-ip middleware
  await app.listen(3000);
}
bootstrap();

