import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** 日期格式化：YYYY-MM-DD */
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 取某天的 00:00:00 */
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** 环比增长百分比，上期为 0 时返回 null（前端显示「—」） */
function growth(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** 数据看板总览 */
  async overview() {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      userTotal,
      bookTotal,
      journalTotal,
      billTotal,
      userThisMonth,
      userLastMonth,
      bookThisMonth,
      bookLastMonth,
      journalThisMonth,
      journalLastMonth,
      billThisMonth,
      billLastMonth,
      pendingJournals,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.travelBook.count(),
      this.prisma.journal.count(),
      this.prisma.bill.count(),
      this.prisma.user.count({ where: { createdAt: { gte: thisMonthStart } } }),
      this.prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
      this.prisma.travelBook.count({ where: { createdAt: { gte: thisMonthStart } } }),
      this.prisma.travelBook.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
      this.prisma.journal.count({ where: { createdAt: { gte: thisMonthStart } } }),
      this.prisma.journal.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
      this.prisma.bill.count({ where: { createdAt: { gte: thisMonthStart } } }),
      this.prisma.bill.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
      this.prisma.journal.count({ where: { auditStatus: 'pending' } }),
    ]);

    return {
      cards: [
        { key: 'users', label: '用户总数', value: userTotal, ratio: growth(userThisMonth, userLastMonth), unit: '人' },
        { key: 'books', label: '旅行册数', value: bookTotal, ratio: growth(bookThisMonth, bookLastMonth), unit: '本' },
        { key: 'journals', label: '游记数', value: journalTotal, ratio: growth(journalThisMonth, journalLastMonth), unit: '篇' },
        { key: 'bills', label: '账单数', value: billTotal, ratio: growth(billThisMonth, billLastMonth), unit: '笔' },
      ],
      pendingJournals,
    };
  }

  /** 近 N 天趋势：新增用户 / 新增游记 */
  async trend(days = 7) {
    const today = startOfDay(new Date());
    const from = addDays(today, -(days - 1));

    const [users, journals] = await Promise.all([
      this.prisma.user.findMany({
        where: { createdAt: { gte: from } },
        select: { createdAt: true },
      }),
      this.prisma.journal.findMany({
        where: { createdAt: { gte: from } },
        select: { createdAt: true },
      }),
    ]);

    // 按天聚合
    const userMap = new Map<string, number>();
    const journalMap = new Map<string, number>();
    for (const u of users) userMap.set(ymd(u.createdAt), (userMap.get(ymd(u.createdAt)) || 0) + 1);
    for (const j of journals) journalMap.set(ymd(j.createdAt), (journalMap.get(ymd(j.createdAt)) || 0) + 1);

    const list = Array.from({ length: days }, (_, i) => {
      const d = addDays(from, i);
      const key = ymd(d);
      return {
        date: key,
        label: `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`,
        users: userMap.get(key) || 0,
        journals: journalMap.get(key) || 0,
      };
    });

    return list;
  }

  /** 内容构成占比 */
  async composition() {
    const [books, journals, bills, spots] = await Promise.all([
      this.prisma.travelBook.count(),
      this.prisma.journal.count(),
      this.prisma.bill.count(),
      this.prisma.mapSpot.count(),
    ]);
    const total = books + journals + bills + spots || 1;
    const pct = (n: number) => Math.round((n / total) * 1000) / 10;

    return [
      { name: '旅行册', value: pct(books), count: books, color: '#2e9e6b' },
      { name: '游记', value: pct(journals), count: journals, color: '#c77b4a' },
      { name: '账单', value: pct(bills), count: bills, color: '#9db8a5' },
      { name: '标注点', value: pct(spots), count: spots, color: '#dce5dd' },
    ];
  }

  /** 最近注册用户 */
  async recentUsers(limit = 5) {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { _count: { select: { travelBooks: true } } },
    });
    return users.map((u) => this.mapUserRow(u, u._count.travelBooks));
  }

  /** 看板一次性取全量（减少前端请求数） */
  async summary() {
    const [overview, trend, composition, recentUsers] = await Promise.all([
      this.overview(),
      this.trend(7),
      this.composition(),
      this.recentUsers(5),
    ]);
    return { ...overview, trend, composition, recentUsers };
  }

  /** 统一的用户行结构（供看板与用户列表共用） */
  mapUserRow(u: any, bookCount: number) {
    return {
      id: u.id,
      nickname: u.nickname || '未设置昵称',
      avatar: u.avatar || '',
      phone: u.phone || '',
      userIdCode: u.userIdCode || '',
      role: u.role,
      status: u.status,
      statusText: u.status === 'normal' ? '正常' : '禁用',
      books: bookCount,
      createdAt: u.createdAt,
      initial: (u.nickname || '游').slice(0, 1),
    };
  }
}
