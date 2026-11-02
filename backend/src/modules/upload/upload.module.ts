import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UploadController } from './upload.controller';

/** 上传根目录：backend/uploads，按 年/月 分目录存放 */
export const UPLOAD_ROOT = join(process.cwd(), 'uploads');

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const now = new Date();
          const sub = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
          const dir = join(UPLOAD_ROOT, sub);
          ensureDir(dir);
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase() || '.jpg';
          const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: 8 * 1024 * 1024 }, // 单文件 8MB
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const ok = ALLOWED_MIME.includes(file.mimetype) || ALLOWED_EXT.includes(ext);
        cb(ok ? null : new Error('仅支持 jpg / png / webp / gif 图片'), ok);
      },
    }),
  ],
  controllers: [UploadController],
})
export class UploadModule {}
