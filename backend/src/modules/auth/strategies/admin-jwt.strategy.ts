import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { UnauthorizedException } from '../../../common/exceptions/business.exception';
import type { AdminPayload } from '../../../common/decorators/current-admin.decorator';

/**
 * 后台管理员 JWT 策略（guard 名：admin-jwt）。
 * 与小程序用户策略严格隔离：payload.type 必须为 'admin'，
 * 且账号需存在于 admin_users 表、状态正常。
 */
@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'traveljournal-dev-secret',
    });
  }

  async validate(payload: { sub: string; type?: string }): Promise<AdminPayload> {
    if (payload.type !== 'admin') {
      throw new UnauthorizedException('该令牌不是后台管理令牌');
    }
    const admin = await this.prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin) throw new UnauthorizedException('管理员账号不存在');
    if (admin.status !== 'normal') throw new UnauthorizedException('管理员账号已被禁用');

    return {
      id: admin.id,
      account: admin.account,
      name: admin.name,
      role: admin.role as AdminPayload['role'],
      status: admin.status,
    };
  }
}
