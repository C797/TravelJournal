import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, AdminRole } from '../decorators/roles.decorator';
import { ForbiddenException } from '../exceptions/business.exception';

/**
 * 后台角色守卫：校验当前管理员是否具备接口要求的角色。
 * 未标注 @Roles 的接口默认放行（仅要求已登录）。
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const admin = context.switchToHttp().getRequest().user;
    if (!admin) throw new ForbiddenException('未登录后台账号');

    // 超级管理员拥有全部权限
    if (admin.role === 'super') return true;

    if (!required.includes(admin.role)) {
      throw new ForbiddenException('当前角色无权执行该操作');
    }
    return true;
  }
}
