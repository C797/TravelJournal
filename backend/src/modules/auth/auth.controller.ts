import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
