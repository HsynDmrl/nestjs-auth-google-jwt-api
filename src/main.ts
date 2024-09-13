import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Interceptor olarak kullanabilir bütün request ve response'ları loglayabiliriz.
  // app.useGlobalInterceptors(app.get(AuditLogInterceptor));

  // Helmet ile güvenlik başlıklarını ayarla
  app.use(helmet());

  // CORS'u etkinleştir, çapraz kaynak isteklerine izin verir
  app.enableCors();

  // Rate limiting uygula, DDoS saldırılarından korunmak için her IP'ye 15 dakika içinde en fazla 100 istek izni verir
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 dakika
      max: 100, // Her IP için 100 istek limiti
    }),
  );

  // Swagger dokümantasyonu yapılandırması
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

  // Dark tema ayarını ekle
  const theme = new SwaggerTheme();
  const options = {
    customCss: theme.getBuffer(SwaggerThemeNameEnum.NORD_DARK),
    swaggerOptions: {
      docExpansion: 'none', // Swagger'da dokümanların varsayılan olarak kapalı görünmesini sağlar
    },
  };

  // Swagger dokümanını oluştur ve 'api' yoluna dokümanı yerleştirir
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, options);

  await app.listen(3000); // Uygulamanın 3000 portunda çalışmasını sağlar
}

bootstrap();

