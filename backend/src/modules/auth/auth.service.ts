import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // 微信登录：code 换取 openid（实际需调用微信 jscode2session）
  async wxLogin(code: string, userInfo?: { nickname?: string; avatar?: string }) {
    if (!code) {
      throw new BusinessException(1001, '缺少登录 code');
    }
    // 模拟 openid 换取；生产环境调用微信接口
    const openid = `mock-openid-${code}`;
    let user = await this.prisma.user.findUnique({ where: { openid } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          openid,
          nickname: userInfo?.nickname || '旅行者',
          avatar: userInfo?.avatar,
          userIdCode: `1${String(10000 + Math.floor(Math.random() * 90000))}`,
        },
      });
    }
    const token = this.signToken(user.id);
    return { token, userInfo: user, userIdCode: user.userIdCode };
  }

  signToken(userId: string): string {
    return this.jwt.sign({ sub: userId });
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: process.env.JWT_SECRET || 'traveljournal-dev-secret',
      }) as any;
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new BusinessException(401, '用户不存在', 401);
      return { newToken: this.signToken(user.id) };
    } catch {
      throw new BusinessException(401, '刷新令牌无效', 401);
    }
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
