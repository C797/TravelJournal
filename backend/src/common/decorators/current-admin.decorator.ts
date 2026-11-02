import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AdminPayload {
  id: string;
  account: string;
  name: string;
  role: 'super' | 'admin' | 'reviewer';
  status: string;
}

/** 从请求上下文取出当前登录的后台管理员 */
export const CurrentAdmin = createParamDecorator(
  (data: keyof AdminPayload | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const admin = req.user as AdminPayload;
    return data ? admin?.[data] : admin;
  },
);
