// 类型化业务错误体系
export class BusinessException extends Error {
  constructor(
    public readonly code: number,
    message: string,
    public readonly httpStatus: number = 400,
  ) {
    super(message);
    this.name = 'BusinessException';
  }
}

export class NotFoundException extends BusinessException {
  constructor(message = '资源不存在') {
    super(404, message, 404);
  }
}

export class UnauthorizedException extends BusinessException {
  constructor(message = '未授权') {
    super(401, message, 401);
  }
}

export class ForbiddenException extends BusinessException {
  constructor(message = '无权限访问') {
    super(403, message, 403);
  }
}
