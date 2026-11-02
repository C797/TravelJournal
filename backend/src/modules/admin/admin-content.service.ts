import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { OperationLogService } from './operation-log.service';
import type { AdminPayload } from '../../common/decorators/current-admin.decorator';

interface PageQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}

function paging(q: PageQuery) {
  const page = Math.max(1, q.page || 1);
  const pageSize = Math.min(100, Math.max(1, q.pageSize || 20));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

@Injectable()
export class AdminContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logs: OperationLogService,
  ) {}

  // ==================== 旅行册 ====================

  async listBooks(q: PageQuery) {
    const { page, pageSize, skip, take } = paging(q);
    const where: any = {};
    if (q.status && q.status !== 'all') where.status = q.status;
    if (q.keyword) {
      where.OR = [
        { name: { contains: q.keyword } },
        { owner: { nickname: { contains: q.keyword } } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.travelBook.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          owner: { select: { id: true, nickname: true, avatar: true } },
          _count: { select: { spots: true, journals: true, members: true } },
        },
      }),
      this.prisma.travelBook.count({ where }),
    ]);

    return {
      list: rows.map((b) => ({
        id: b.id,
        name: b.name,
        coverUrl: b.coverUrl || '',
        owner: b.owner?.nickname || '—',
        ownerId: b.ownerId,
        spots: b._count.spots,
        journals: b._count.journals,
        members: b._count.members,
        bookIsPublic: b.bookIsPublic,
        status: b.status,
        statusText: b.status === 'normal' ? '正常' : '已下架',
        startTime: b.startTime,
        endTime: b.endTime,
        createdAt: b.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async bookDetail(id: string) {
    const book = await this.prisma.travelBook.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, nickname: true, avatar: true, userIdCode: true } },
        members: { include: { user: { select: { id: true, nickname: true, avatar: true } } } },
        spots: { orderBy: { createdAt: 'desc' } },
        ledger: { select: { id: true, name: true, status: true } },
        _count: { select: { journals: true } },
      },
    });
    if (!book) throw new BusinessException(404, '旅行册不存在', 404);

    const journals = await this.prisma.journal.findMany({
      where: { bookId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, title: true, travelDate: true, auditStatus: true,
        isPublic: true, createdAt: true,
        user: { select: { id: true, nickname: true } },
      },
    });

    return { ...book, journalCount: book._count.journals, recentJournals: journals };
  }

  async updateBookStatus(admin: AdminPayload, id: string, status: string, ip?: string) {
    if (!['normal', 'disabled'].includes(status)) {
      throw new BusinessException(1001, '状态值不合法');
    }
    const book = await this.prisma.travelBook.findUnique({ where: { id } });
    if (!book) throw new BusinessException(404, '旅行册不存在', 404);

    await this.prisma.travelBook.update({ where: { id }, data: { status } });
    await this.logs.write(admin, {
      module: 'travelBook',
      action: status === 'normal' ? 'enable' : 'disable',
      targetId: id,
      content: `${status === 'normal' ? '恢复' : '下架'}旅行册「${book.name}」`,
      ip,
    });
    return { id, status };
  }

  async removeBook(admin: AdminPayload, id: string, ip?: string) {
    const book = await this.prisma.travelBook.findUnique({ where: { id } });
    if (!book) throw new BusinessException(404, '旅行册不存在', 404);

    await this.prisma.travelBook.delete({ where: { id } });
    await this.logs.write(admin, {
      module: 'travelBook',
      action: 'delete',
      targetId: id,
      content: `删除旅行册「${book.name}」`,
      ip,
    });
    return { success: true };
  }

  // ==================== 游记 ====================

  async listJournals(q: PageQuery & { auditStatus?: string }) {
    const { page, pageSize, skip, take } = paging(q);
    const where: any = {};
    if (q.auditStatus && q.auditStatus !== 'all') where.auditStatus = q.auditStatus;
    if (q.keyword) {
      where.OR = [
        { title: { contains: q.keyword } },
        { user: { nickname: { contains: q.keyword } } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.journal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: { select: { id: true, nickname: true, avatar: true } },
          travelBook: { select: { id: true, name: true } },
          _count: { select: { images: true } },
        },
      }),
      this.prisma.journal.count({ where }),
    ]);

    return {
      list: rows.map((j) => ({
        id: j.id,
        title: j.title,
        author: j.user?.nickname || '—',
        authorId: j.userId,
        book: j.travelBook?.name || '—',
        bookId: j.bookId,
        words: j.content.length,
        imageCount: j._count.images,
        isPublic: j.isPublic,
        auditStatus: j.auditStatus,
        statusText:
          j.auditStatus === 'pass' ? '已通过' : j.auditStatus === 'reject' ? '已驳回' : '待审核',
        travelDate: j.travelDate,
        createdAt: j.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async journalDetail(id: string) {
    const j = await this.prisma.journal.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
        travelBook: { select: { id: true, name: true } },
        spot: { select: { id: true, locationName: true, province: true, city: true } },
        images: { orderBy: { sort: 'asc' } },
      },
    });
    if (!j) throw new BusinessException(404, '游记不存在', 404);
    return j;
  }

  /** 审核游记：pass 通过 / reject 驳回 */
  async auditJournal(admin: AdminPayload, id: string, auditStatus: string, ip?: string) {
    if (!['pass', 'reject', 'pending'].includes(auditStatus)) {
      throw new BusinessException(1001, '审核状态不合法');
    }
    const j = await this.prisma.journal.findUnique({ where: { id } });
    if (!j) throw new BusinessException(404, '游记不存在', 404);

    await this.prisma.journal.update({ where: { id }, data: { auditStatus } });
    const text = auditStatus === 'pass' ? '通过' : auditStatus === 'reject' ? '驳回' : '重置为待审核';
    await this.logs.write(admin, {
      module: 'journal',
      action: 'audit',
      targetId: id,
      content: `${text}游记「${j.title}」`,
      ip,
    });
    return { id, auditStatus };
  }

  async removeJournal(admin: AdminPayload, id: string, ip?: string) {
    const j = await this.prisma.journal.findUnique({ where: { id } });
    if (!j) throw new BusinessException(404, '游记不存在', 404);

    await this.prisma.journal.delete({ where: { id } });
    await this.logs.write(admin, {
      module: 'journal',
      action: 'delete',
      targetId: id,
      content: `删除游记「${j.title}」`,
      ip,
    });
    return { success: true };
  }

  // ==================== 账本 ====================

  async listLedgers(q: PageQuery) {
    const { page, pageSize, skip, take } = paging(q);
    const where: any = {};
    if (q.status && q.status !== 'all') where.status = q.status;
    if (q.keyword) {
      where.OR = [
        { name: { contains: q.keyword } },
        { book: { name: { contains: q.keyword } } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.ledger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          book: { select: { id: true, name: true } },
          _count: { select: { members: true, bills: true } },
        },
      }),
      this.prisma.ledger.count({ where }),
    ]);

    // 汇总每个账本的支出（一次 groupBy 避免 N+1）
    const sums = await this.prisma.bill.groupBy({
      by: ['ledgerId'],
      where: { ledgerId: { in: rows.map((r) => r.id) }, billType: 'expense' },
      _sum: { amount: true },
    });
    const sumMap = new Map(sums.map((s) => [s.ledgerId, Number(s._sum.amount || 0)]));

    return {
      list: rows.map((l) => ({
        id: l.id,
        name: l.name,
        book: l.book?.name || '—',
        bookId: l.bookId,
        members: l._count.members,
        bills: l._count.bills,
        totalExpense: sumMap.get(l.id) || 0,
        status: l.status,
        statusText: l.status === 'normal' ? '正常' : '已停用',
        createdAt: l.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async ledgerDetail(id: string) {
    const ledger = await this.prisma.ledger.findUnique({
      where: { id },
      include: {
        book: { select: { id: true, name: true, owner: { select: { id: true, nickname: true } } } },
        owner: { select: { id: true, nickname: true, avatar: true } },
        members: { include: { user: { select: { id: true, nickname: true, avatar: true } } } },
        _count: { select: { bills: true } },
      },
    });
    if (!ledger) throw new BusinessException(404, '账本不存在', 404);

    const [expense, income, byCategory] = await Promise.all([
      this.prisma.bill.aggregate({
        where: { ledgerId: id, billType: 'expense' },
        _sum: { amount: true },
      }),
      this.prisma.bill.aggregate({
        where: { ledgerId: id, billType: 'income' },
        _sum: { amount: true },
      }),
      this.prisma.bill.groupBy({
        by: ['category'],
        where: { ledgerId: id, billType: 'expense' },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    return {
      ...ledger,
      summary: {
        expense: Number(expense._sum.amount || 0),
        income: Number(income._sum.amount || 0),
        balance: Number(income._sum.amount || 0) - Number(expense._sum.amount || 0),
        billCount: ledger._count.bills,
      },
      byCategory: byCategory.map((c) => ({
        category: c.category,
        amount: Number(c._sum.amount || 0),
        count: c._count._all,
      })),
    };
  }

  async updateLedgerStatus(admin: AdminPayload, id: string, status: string, ip?: string) {
    if (!['normal', 'disabled'].includes(status)) {
      throw new BusinessException(1001, '状态值不合法');
    }
    const ledger = await this.prisma.ledger.findUnique({ where: { id } });
    if (!ledger) throw new BusinessException(404, '账本不存在', 404);

    await this.prisma.ledger.update({ where: { id }, data: { status } });
    await this.logs.write(admin, {
      module: 'ledger',
      action: status === 'normal' ? 'enable' : 'disable',
      targetId: id,
      content: `${status === 'normal' ? '启用' : '停用'}账本「${ledger.name}」`,
      ip,
    });
    return { id, status };
  }

  async removeLedger(admin: AdminPayload, id: string, ip?: string) {
    const ledger = await this.prisma.ledger.findUnique({ where: { id } });
    if (!ledger) throw new BusinessException(404, '账本不存在', 404);

    await this.prisma.ledger.delete({ where: { id } });
    await this.logs.write(admin, {
      module: 'ledger',
      action: 'delete',
      targetId: id,
      content: `删除账本「${ledger.name}」`,
      ip,
    });
    return { success: true };
  }
}
