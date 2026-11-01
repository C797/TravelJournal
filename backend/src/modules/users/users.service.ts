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
}
