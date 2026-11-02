import { Body, Controller, Get, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import type { AdminPayload } from '../../common/decorators/current-admin.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==================== 小程序端 ====================

  /** 微信登录：用 wx.login 拿到的 code 换登录态 */
  @Post('wx-login')
  async wxLogin(@Body() body: { code: string; nickname?: string; avatar?: string }) {
    return this.authService.wxLogin(body.code, {
      nickname: body.nickname,
      avatar: body.avatar,
    });
  }

  @Post('refresh-token')
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  /** 小程序登出：前端清本地登录态，服务端记录一次登出（JWT 无状态，不做黑名单） */
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: any) {
    return this.authService.logout(req.user?.id);
  }

  // ==================== 后台管理端 ====================

  /** 管理员账号密码登录 */
  @Post('admin/login')
  async adminLogin(
    @Body() body: { account: string; password: string },
    @Ip() ip: string,
    @Req() req: any,
  ) {
    return this.authService.adminLogin(body.account, body.password, ip, req.headers?.['user-agent']);
  }

  /** 当前管理员信息 */
  @Get('admin/profile')
  @UseGuards(AuthGuard('admin-jwt'))
  async adminProfile(@CurrentAdmin() admin: AdminPayload) {
    return this.authService.adminProfile(admin.id);
  }

  /** 管理员登出（前端清除 token，此处仅记录日志） */
  @Post('admin/logout')
  @UseGuards(AuthGuard('admin-jwt'))
  async adminLogout(@CurrentAdmin() admin: AdminPayload, @Ip() ip: string) {
    return this.authService.adminLogout(admin, ip);
  }
}
