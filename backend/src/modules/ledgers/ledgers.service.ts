import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '../../common/exceptions/business.exception';

@Injectable()
export class LedgersService {
  constructor(private readonly prisma: PrismaService) {}

  private async isMember(ledgerId: string, userId: string) {
    const m = await this.prisma.ledgerMember.findUnique({
      where: { ledgerId_userId: { ledgerId, userId } },
    });
    return !!m;
  }

  async getByBook(userId: string, bookId: string) {
    const ledger = await this.prisma.ledger.findUnique({
      where: { bookId },
      include: { members: true },
    });
    if (!ledger) throw new NotFoundException('账本不存在');
    if (!(await this.isMember(ledger.id, userId))) throw new ForbiddenException('无权限');
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [monthExpense, monthIncome, todayExpense] = await Promise.all([
      this.prisma.bill.aggregate({
        where: { ledgerId: ledger.id, billType: 'expense', billDate: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.bill.aggregate({
        where: { ledgerId: ledger.id, billType: 'income', billDate: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.bill.aggregate({
        where: { ledgerId: ledger.id, billType: 'expense', billDate: { gte: dayStart } },
        _sum: { amount: true },
      }),
    ]);
    const expense = Number(monthExpense._sum.amount || 0);
    const income = Number(monthIncome._sum.amount || 0);
    return {
      id: ledger.id,
      name: ledger.name,
      monthExpense: expense,
      monthIncome: income,
      monthBalance: income - expense,
      todayExpense: Number(todayExpense._sum.amount || 0),
    };
  }

  async members(userId: string, ledgerId: string) {
    if (!(await this.isMember(ledgerId, userId))) throw new ForbiddenException('无权限');
    return this.prisma.ledgerMember.findMany({
      where: { ledgerId },
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async removeMember(operatorId: string, ledgerId: string, targetUserId: string) {
    const ledger = await this.prisma.ledger.findUnique({ where: { id: ledgerId } });
    if (!ledger) throw new NotFoundException('账本不存在');
    if (ledger.ownerId !== operatorId) throw new ForbiddenException('仅创建者可移除成员');
    await this.prisma.ledgerMember.delete({
      where: { ledgerId_userId: { ledgerId, userId: targetUserId } },
    });
    return { success: true };
  }

  async stats(userId: string, ledgerId: string, scope: 'week' | 'month' | 'year') {
    if (!(await this.isMember(ledgerId, userId))) throw new ForbiddenException('无权限');
    const now = new Date();
    let start: Date;
    if (scope === 'week') {
      const day = now.getDay() || 7;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
    } else if (scope === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
    }
    const total = await this.prisma.bill.aggregate({
      where: { ledgerId, billType: 'expense', billDate: { gte: start } },
      _sum: { amount: true },
    });
    const memberCount = await this.prisma.ledgerMember.count({ where: { ledgerId } });
    const totalExpense = Number(total._sum.amount || 0);

    // 分类占比
    const byCategory = await this.prisma.bill.groupBy({
      by: ['category'],
      where: { ledgerId, billType: 'expense', billDate: { gte: start } },
      _sum: { amount: true },
    });
    const categoryRatio = byCategory
      .map((c) => ({
        name: c.category,
        value: totalExpense ? Math.round((Number(c._sum.amount || 0) / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      totalExpense,
      avgExpense: memberCount ? Number((totalExpense / memberCount).toFixed(2)) : 0,
      memberCount,
      categoryRatio,
      dailyTrend: [],
      prevPeriodRatio: null,
    };
  }

  async exportBills(userId: string, ledgerId: string, startDate?: string, endDate?: string) {
    if (!(await this.isMember(ledgerId, userId))) throw new ForbiddenException('无权限');
    const bills = await this.prisma.bill.findMany({
      where: {
        ledgerId,
        billDate: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      orderBy: { billDate: 'desc' },
    });
    return { downloadUrl: `/api/ledgers/${ledgerId}/export/file`, billCount: bills.length, bills };
  }
}
