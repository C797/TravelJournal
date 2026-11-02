import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, UnauthorizedException } from '../../common/exceptions/business.exception';
import type { AdminPayload } from '../../common/decorators/current-admin.decorator';

interface WxSession {
  openid: string;
  unionid?: string;
  session_key?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ==================== 微信登录 ====================

  /**
   * 微信登录：code → openid。
   * 已配置 WECHAT_APPID / WECHAT_SECRET 时走真实 jscode2session；
   * 未配置时降级为本地开发用的确定性 openid，保证前端可独立联调。
   */
  async wxLogin(code: string, userInfo?: { nickname?: string; avatar?: string }) {
    if (!code) throw new BusinessException(1001, '缺少登录 code');

    const session = await this.code2Session(code);
    const openid = session.openid;

    let user = await this.prisma.user.findUnique({ where: { openid } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          openid,
          nickname: userInfo?.nickname || '旅行者',
          avatar: userInfo?.avatar,
          userIdCode: await this.genUserIdCode(),
        },
      });
    }
    if (user.status !== 'normal') {
      throw new UnauthorizedException('账号已被禁用，请联系客服');
    }

    const token = this.signToken(user.id);
    const { openid: _omit, ...safeUser } = user;
    return {
      token,
      refreshToken: this.jwt.sign({ sub: user.id, refresh: true }, { expiresIn: '30d' }),
      userInfo: safeUser,
      userIdCode: user.userIdCode,
    };
  }

  /** 调用微信接口用 code 换 openid */
  private async code2Session(code: string): Promise<WxSession> {
    const appid = process.env.WECHAT_APPID;
    const secret = process.env.WECHAT_SECRET;

    if (!appid || !secret) {
      // 本地开发降级：同一 code 恒定映射同一 openid，方便反复调试
      this.logger.warn('未配置 WECHAT_APPID / WECHAT_SECRET，微信登录走本地降级模式');
      return { openid: `dev-openid-${code}` };
    }

    const url =
      'https://api.weixin.qq.com/sns/jscode2session' +
      `?appid=${encodeURIComponent(appid)}` +
      `&secret=${encodeURIComponent(secret)}` +
      `&js_code=${encodeURIComponent(code)}` +
      '&grant_type=authorization_code';

    try {
      const res = await fetch(url);
      const data: any = await res.json();
      if (!data.openid) {
        this.logger.error(`jscode2session 失败: ${JSON.stringify(data)}`);
        throw new BusinessException(1002, data.errmsg || '微信登录失败，请重试');
      }
      return { openid: data.openid, unionid: data.unionid, session_key: data.session_key };
    } catch (e: any) {
      if (e instanceof BusinessException) throw e;
      this.logger.error(`jscode2session 请求异常: ${e?.message}`);
      throw new BusinessException(1002, '微信登录服务暂不可用');
    }
  }

  private async genUserIdCode(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const code = String(10000000 + Math.floor(Math.random() * 89999999));
      const exists = await this.prisma.user.findFirst({ where: { userIdCode: code } });
      if (!exists) return code;
    }
    return String(Date.now()).slice(-8);
  }

  // ==================== 令牌 ====================

  signToken(userId: string): string {
    return this.jwt.sign({ sub: userId });
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: process.env.JWT_SECRET || 'traveljournal-dev-secret',
      }) as any;
      if (!payload?.refresh) throw new Error('not a refresh token');
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new BusinessException(401, '用户不存在', 401);
      return { newToken: this.signToken(user.id) };
    } catch {
      throw new BusinessException(401, '刷新令牌无效', 401);
    }
  }

  /** 小程序登出：JWT 无状态，服务端仅做一次确认，前端负责清除本地令牌 */
  async logout(userId?: string) {
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, nickname: true },
      });
      if (user) this.logger.log(`用户登出: ${user.nickname}(${user.id})`);
    }
    return { success: true };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  // ==================== 后台管理员 ====================

  async adminLogin(account: string, password: string, ip?: string, userAgent?: string) {
    if (!account || !password) {
      throw new BusinessException(1001, '请输入账号和密码');
    }

    const admin = await this.prisma.adminUser.findUnique({ where: { account } });
    // 账号不存在与密码错误返回同一提示，避免账号枚举
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw new UnauthorizedException('账号或密码错误');
    }
    if (admin.status !== 'normal') {
      throw new UnauthorizedException('该管理员账号已被禁用');
    }

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });

    await this.prisma.operationLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        module: 'auth',
        action: 'login',
        content: '管理员登录后台',
        ip,
        userAgent,
      },
    });

    const token = this.jwt.sign({ sub: admin.id, type: 'admin', role: admin.role });
    return {
      token,
      adminInfo: {
        id: admin.id,
        account: admin.account,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  async adminProfile(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin) throw new BusinessException(404, '管理员不存在', 404);
    const { passwordHash: _omit, ...safe } = admin;
    return safe;
  }

  async adminLogout(admin: AdminPayload, ip?: string) {
    await this.prisma.operationLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        module: 'auth',
        action: 'logout',
        content: '管理员退出登录',
        ip,
      },
    });
    return { success: true };
  }
}
