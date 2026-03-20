import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const configService = app.get(ConfigService);

  app.use(cookieParser());
  app.enableCors({
    origin: configService.get<string>('CLIENT_URL') || '*',
    credentials: true,
  });


  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
