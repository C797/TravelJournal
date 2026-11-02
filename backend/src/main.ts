import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS：显式来源（生产环境通过环境变量配置）
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:8080'];
  app.enableCors({ origin: corsOrigin, credentials: true });

  // 全局前缀
  app.setGlobalPrefix('api');

  // 上传文件静态托管：/uploads/xxx.jpg（不经过 /api 前缀）
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // 输入校验
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // 统一响应与异常
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`途记 TravelJournal 后端服务已启动: http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(`静态资源目录: http://localhost:${port}/uploads`, 'Bootstrap');
}
bootstrap();
