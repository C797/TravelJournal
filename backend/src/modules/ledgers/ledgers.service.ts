import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, NotFoundException, ForbiddenException } from '../../common/exceptions/business.exception';

@Injectable()
export class LedgersService {
  constructor(private readonly prisma: PrismaService) {}

  private async isMember(ledgerId: string, userId: string) {
    const m = await this.prisma.ledgerMember.findUnique({
      where: { ledgerId_userId: { ledgerId, userId } },
    });
    return !!m;
  }

  /**
   * 新建或更新账本。
   * 账本与旅行册 1:1：已存在则更新名称/公开性，并把新成员加入；不存在则创建。
   */
  async createOrUpdate(
    userId: string,
    input: { bookId: string; name: string; isPublic?: boolean; memberIds?: string[] },
  ) {
    if (!input.bookId) throw new BusinessException(1001, '请选择所属旅行册');
    if (!input.name?.trim()) throw new BusinessException(1001, '请填写账本名称');

    const book = await this.prisma.travelBook.findUnique({ where: { id: input.bookId } });
    if (!book) throw new NotFoundException('旅行册不存在');

    const isMember = await this.prisma.travelBookMember.findUnique({
      where: { bookId_userId: { bookId: input.bookId, userId } },
    });
    if (!isMember && book.ownerId !== userId) {
      throw new ForbiddenException('无权限在该旅行册下创建账本');
    }

    // 过滤掉不存在的用户 id，避免外键报错
    const validMemberIds = input.memberIds?.length
      ? (
          await this.prisma.user.findMany({
            where: { id: { in: input.memberIds } },
            select: { id: true },
          })
        ).map((u) => u.id)
      : [];

    const existing = await this.prisma.ledger.findUnique({ where: { bookId: input.bookId } });

    if (existing) {
      if (existing.ownerId !== userId) throw new ForbiddenException('仅创建者可修改账本');

      // SQLite 不支持 createMany 的 skipDuplicates，先剔除已是成员的 id
      const currentMembers = await this.prisma.ledgerMember.findMany({
        where: { ledgerId: existing.id },
        select: { userId: true },
      });
      const joined = new Set(currentMembers.map((m) => m.userId));
      const toAdd = validMemberIds.filter((id) => id !== userId && !joined.has(id));

      const updated = await this.prisma.ledger.update({
        where: { id: existing.id },
        data: {
          name: input.name.trim(),
          isPublic: input.isPublic ?? existing.isPublic,
          ...(toAdd.length
            ? { members: { create: toAdd.map((id) => ({ userId: id, role: 'member' })) } }
            : {}),
        },
        include: { members: true },
      });
      return updated;
    }

    const ledger = await this.prisma.ledger.create({
      data: {
        bookId: input.bookId,
        name: input.name.trim(),
        ownerId: userId,
        isPublic: input.isPublic ?? false,
        members: {
          create: [
            { userId, role: 'creator' },
            ...validMemberIds
              .filter((id) => id !== userId)
              .map((id) => ({ userId: id, role: 'member' })),
          ],
        },
      },
      include: { members: true },
    });
    return ledger;
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
    const [monthExpense, monthIncome, todayExpense, totalExpense, billCount] = await Promise.all([
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
      this.prisma.bill.aggregate({
        where: { ledgerId: ledger.id, billType: 'expense' },
        _sum: { amount: true },
      }),
      this.prisma.bill.count({ where: { ledgerId: ledger.id } }),
    ]);
    const expense = Number(monthExpense._sum.amount || 0);
    const income = Number(monthIncome._sum.amount || 0);
    const memberCount = ledger.members.length || 1;
    return {
      id: ledger.id,
      bookId: ledger.bookId,
      name: ledger.name,
      ownerId: ledger.ownerId,
      status: ledger.status,
      memberCount,
      monthExpense: expense,
      monthIncome: income,
      monthBalance: income - expense,
      todayExpense: Number(todayExpense._sum.amount || 0),
      totalExpense: Number(totalExpense._sum.amount || 0),
      avgExpense: Number((Number(totalExpense._sum.amount || 0) / memberCount).toFixed(2)),
      billCount,
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
    let prevStart: Date;
    if (scope === 'week') {
      const day = now.getDay() || 7;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
      prevStart = new Date(start.getTime() - 7 * 24 * 3600 * 1000);
    } else if (scope === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
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
        amount: Number(c._sum.amount || 0),
      }))
      .sort((a, b) => b.value - a.value);

    // 每日支出趋势：SQLite 无法按天截断 groupBy，拉账单后在内存聚合
    const bills = await this.prisma.bill.findMany({
      where: { ledgerId, billType: 'expense', billDate: { gte: start } },
      select: { billDate: true, amount: true },
    });
    const dayMap = new Map<string, number>();
    for (const b of bills) {
      const d = b.billDate;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`;
      dayMap.set(key, (dayMap.get(key) || 0) + Number(b.amount || 0));
    }
    const dailyTrend = Array.from(dayMap.entries())
      .map(([date, value]) => ({ date, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 上一周期总支出，用于「较上期」环比
    const prevTotal = await this.prisma.bill.aggregate({
      where: { ledgerId, billType: 'expense', billDate: { gte: prevStart, lt: start } },
      _sum: { amount: true },
    });
    const prevExpense = Number(prevTotal._sum.amount || 0);
    const prevPeriodRatio =
      prevExpense > 0 ? Number((((totalExpense - prevExpense) / prevExpense) * 100).toFixed(1)) : null;

    return {
      totalExpense,
      avgExpense: memberCount ? Number((totalExpense / memberCount).toFixed(2)) : 0,
      memberCount,
      categoryRatio,
      dailyTrend,
      prevPeriodRatio,
      prevExpense,
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
