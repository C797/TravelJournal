import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { OperationLogService } from './operation-log.service';
import type { AdminPayload } from '../../common/decorators/current-admin.decorator';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logs: OperationLogService,
  ) {}

  /** 用户列表（分页 + 关键词 + 状态） */
  async list(params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));

    const where: any = {};
    if (params.status && params.status !== 'all') where.status = params.status;
    if (params.keyword) {
      where.OR = [
        { nickname: { contains: params.keyword } },
        { phone: { contains: params.keyword } },
        { userIdCode: { contains: params.keyword } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { travelBooks: true, journals: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      list: rows.map((u) => ({
        id: u.id,
        nickname: u.nickname || '未设置昵称',
        avatar: u.avatar || '',
        phone: u.phone || '',
        userIdCode: u.userIdCode || '',
        role: u.role,
        status: u.status,
        statusText: u.status === 'normal' ? '正常' : '禁用',
        books: u._count.travelBooks,
        journals: u._count.journals,
        createdAt: u.createdAt,
        initial: (u.nickname || '游').slice(0, 1),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  /** 用户详情：基础信息 + 内容统计 + 最近游记 */
  async detail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { travelBooks: true, journals: true, bills: true, bookMembers: true } },
        journals: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, title: true, travelDate: true, auditStatus: true, createdAt: true },
        },
      },
    });
    if (!user) throw new BusinessException(404, '用户不存在', 404);

    const totalExpense = await this.prisma.bill.aggregate({
      where: { userId: id, billType: 'expense' },
      _sum: { amount: true },
    });

    const { openid: _omit, ...safe } = user;
    return {
      ...safe,
      stats: {
        travelBooks: user._count.travelBooks,
        journals: user._count.journals,
        bills: user._count.bills,
        joinedBooks: user._count.bookMembers,
        totalExpense: Number(totalExpense._sum.amount || 0),
      },
      recentJournals: user.journals,
    };
  }

  /** 启用 / 禁用用户 */
  async updateStatus(admin: AdminPayload, id: string, status: string, ip?: string) {
    if (!['normal', 'disabled'].includes(status)) {
      throw new BusinessException(1001, '状态值不合法');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BusinessException(404, '用户不存在', 404);

    await this.prisma.user.update({ where: { id }, data: { status } });
    await this.logs.write(admin, {
      module: 'user',
      action: status === 'normal' ? 'enable' : 'disable',
      targetId: id,
      content: `${status === 'normal' ? '启用' : '禁用'}用户「${user.nickname || user.id}」`,
      ip,
    });
    return { id, status };
  }

  /** 删除用户（连带内容，谨慎操作，仅超级管理员） */
  async remove(admin: AdminPayload, id: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BusinessException(404, '用户不存在', 404);

    await this.prisma.user.delete({ where: { id } });
    await this.logs.write(admin, {
      module: 'user',
      action: 'delete',
      targetId: id,
      content: `删除用户「${user.nickname || user.id}」`,
      ip,
    });
    return { success: true };
  }
}
