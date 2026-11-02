import { Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { BusinessException } from '../../common/exceptions/business.exception';

/**
 * 图片上传。同时服务小程序端与后台管理端：
 * - 小程序端携带用户 JWT（jwt 策略）
 * - 后台携带管理员 JWT（admin-jwt 策略）
 * 两者是不同策略，这里只校验「任一有效」由各自路由完成，
 * 因此本控制器不挂全局守卫，改由前端显式传 token 到两个 controller 上。
 */
@Controller('upload')
export class UploadController {
  /** 小程序端上传（用户登录态） */
  @Post('image')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  uploadByUser(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    return this.buildResult(file, req);
  }

  /** 后台端上传（管理员登录态） */
  @Post('admin/image')
  @UseGuards(AuthGuard('admin-jwt'))
  @UseInterceptors(FileInterceptor('file'))
  uploadByAdmin(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    return this.buildResult(file, req);
  }

  /** 多图上传（游记相册用，前端逐张调用即可） */
  @Post('images')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  uploadMulti(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    return this.buildResult(file, req);
  }

  private buildResult(file: Express.Multer.File | undefined, req: Request) {
    if (!file) throw new BusinessException(1001, '未接收到文件，请检查字段名是否为 file');

    // 相对路径：uploads/202611/xxx.jpg
    const relative = file.path
      .replace(/\\/g, '/')
      .split('/uploads/')
      .pop() as string;
    const urlPath = `/uploads/${relative}`;

    const host = req.headers.host || `localhost:${process.env.PORT || 3000}`;
    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';

    return {
      url: `${protocol}://${host}${urlPath}`,
      path: urlPath,
      size: file.size,
      mimetype: file.mimetype,
      filename: file.filename,
    };
  }
}
