import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminPayload } from '../../common/decorators/current-admin.decorator';

export interface LogInput {
  module: 'user' | 'travelBook' | 'journal' | 'ledger' | 'system' | 'auth';
  action: 'create' | 'update' | 'delete' | 'audit' | 'disable' | 'enable' | 'login' | 'logout';
  targetId?: string;
  content: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class OperationLogService {
  constructor(private readonly prisma: PrismaService) {}

  /** 记录一条后台操作日志（失败不阻断主流程） */
  async write(admin: AdminPayload | null, input: LogInput) {
    try {
      await this.prisma.operationLog.create({
        data: {
          adminId: admin?.id,
          adminName: admin?.name,
          module: input.module,
          action: input.action,
          targetId: input.targetId,
          content: input.content,
          ip: input.ip,
          userAgent: input.userAgent,
        },
      });
    } catch {
      // 日志失败不影响业务
    }
  }

  /** 分页查询日志 */
  async list(params: {
    page?: number;
    pageSize?: number;
    module?: string;
    keyword?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));

    const where: any = {};
    if (params.module && params.module !== 'all') where.module = params.module;
    if (params.keyword) {
      where.OR = [
        { content: { contains: params.keyword } },
        { adminName: { contains: params.keyword } },
        { ip: { contains: params.keyword } },
      ];
    }
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [list, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.operationLog.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }
}
