import { SetMetadata } from '@nestjs/common';

/** 后台管理员角色 */
export type AdminRole = 'super' | 'admin' | 'reviewer';

export const ROLES_KEY = 'roles';

/**
 * 限定接口可访问的后台角色。
 * 需与 AdminJwtGuard + RolesGuard 配合使用。
 * @example @Roles('super', 'admin')
 */
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
