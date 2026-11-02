import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '../../common/exceptions/business.exception';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    const { openid, ...safe } = user;
    return safe;
  }

  async updateMe(userId: string, data: { nickname?: string; avatar?: string; signature?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async getMyStats(userId: string) {
    const [travelBooks, journals, spots, bills] = await Promise.all([
      this.prisma.travelBook.count({ where: { ownerId: userId } }),
      this.prisma.journal.count({ where: { userId } }),
      this.prisma.mapSpot.count({
        where: { travelBook: { ownerId: userId } },
      }),
      this.prisma.bill.count({ where: { userId } }),
    ]);
    return { travelBooks, journals, spots, bills };
  }

  async exportMyData(userId: string) {
    const journals = await this.prisma.journal.findMany({
      where: { userId },
      select: { title: true, locationName: true, travelDate: true, createdAt: true },
    });
    const bills = await this.prisma.bill.findMany({
      where: { userId },
      select: { category: true, amount: true, billDate: true, remark: true },
    });
    return {
      downloadUrl: `/api/users/me/export/file?userId=${userId}`,
      journalCount: journals.length,
      billCount: bills.length,
    };
  }

  /**
   * 我的全部标注点（跨所有旅行册）。
   * 首页「足迹地图」用：需要经纬度、省市、到访状态。
   */
  async mySpots(userId: string) {
    const spots = await this.prisma.mapSpot.findMany({
      where: {
        travelBook: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      },
      include: { _count: { select: { journals: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return spots.map((s) => ({
      id: s.id,
      bookId: s.bookId,
      locationName: s.locationName,
      province: s.province,
      city: s.city,
      longitude: s.longitude,
      latitude: s.latitude,
      markStatus: s.markStatus,
      visitDate: s.visitDate,
      journalCount: s._count.journals,
    }));
  }

  /** 我的最近游记（跨所有旅行册），首页「最近的故事」用 */
  async myJournals(userId: string, limit = 5) {
    return this.prisma.journal.findMany({
      where: { userId },
      orderBy: [{ travelDate: 'desc' }, { createdAt: 'desc' }],
      take: Math.min(50, Math.max(1, limit)),
      include: {
        images: { orderBy: { sort: 'asc' }, take: 1 },
        travelBook: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * 可邀请的人：与我同处某个旅行册的其他成员（去重）。
   * 没有独立好友体系时，这是最自然的关系来源。
   */
  async myFriends(userId: string) {
    const myBooks = await this.prisma.travelBookMember.findMany({
      where: { userId },
      select: { bookId: true },
    });
    if (!myBooks.length) return [];

    const members = await this.prisma.travelBookMember.findMany({
      where: {
        bookId: { in: myBooks.map((b) => b.bookId) },
        userId: { not: userId },
      },
      include: {
        user: {
          select: { id: true, nickname: true, avatar: true, signature: true, status: true },
        },
      },
    });

    const seen = new Set<string>();
    const result: any[] = [];
    for (const m of members) {
      if (!m.user || seen.has(m.user.id) || m.user.status !== 'normal') continue;
      seen.add(m.user.id);
      result.push({
        ...m.user,
        nickname: m.user.nickname || '未设置昵称',
      });
    }
    return result;
  }
}
