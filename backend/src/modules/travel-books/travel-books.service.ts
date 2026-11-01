import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, NotFoundException, ForbiddenException } from '../../common/exceptions/business.exception';

@Injectable()
export class TravelBooksService {
  constructor(private readonly prisma: PrismaService) {}

  private tripDays(start: Date, end: Date): number {
    const diff = end.getTime() - start.getTime();
    return Math.round(diff / (24 * 3600 * 1000)) + 1;
  }

  // 判断用户是否为册子成员
  private async isMember(bookId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.travelBookMember.findUnique({
      where: { bookId_userId: { bookId, userId } },
    });
    return !!member;
  }

  async list(userId: string) {
    const books = await this.prisma.travelBook.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: {
        _count: { select: { journals: true, spots: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return books.map((b) => ({
      id: b.id,
      coverUrl: b.coverUrl,
      name: b.name,
      startTime: b.startTime,
      endTime: b.endTime,
      bookIsPublic: b.bookIsPublic,
      yearMonth: `${String(b.startTime.getMonth() + 1).padStart(2, '0')}/${b.startTime.getFullYear()}`,
      journalCount: b._count.journals,
      spotCount: b._count.spots,
      tripDays: this.tripDays(b.startTime, b.endTime),
    }));
  }

  async create(userId: string, data: any) {
    if (new Date(data.endTime) < new Date(data.startTime)) {
      throw new BusinessException(1002, '结束时间不能早于开始时间');
    }
    const book = await this.prisma.travelBook.create({
      data: {
        name: data.name,
        coverUrl: data.coverUrl,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        bookIsPublic: data.bookIsPublic ?? false,
        ownerId: userId,
        members: {
          create: { userId, role: 'creator' },
        },
      },
    });
    // 创建关联账本
    await this.prisma.ledger.create({
      data: {
        bookId: book.id,
        name: `${book.name}账本`,
        ownerId: userId,
        members: { create: { userId, role: 'creator' } },
      },
    });
    return book;
  }

  async update(userId: string, id: string, data: any) {
    const book = await this.prisma.travelBook.findUnique({ where: { id } });
    if (!book) throw new NotFoundException('旅行册不存在');
    if (book.ownerId !== userId) throw new ForbiddenException('仅创建者可修改');
    return this.prisma.travelBook.update({
      where: { id },
      data: {
        name: data.name,
        coverUrl: data.coverUrl,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        bookIsPublic: data.bookIsPublic,
      },
    });
  }

  async remove(userId: string, id: string) {
    const book = await this.prisma.travelBook.findUnique({ where: { id } });
    if (!book) throw new NotFoundException('旅行册不存在');
    if (book.ownerId !== userId) throw new ForbiddenException('仅创建者可删除');
    await this.prisma.travelBook.delete({ where: { id } });
    return { success: true };
  }

  async detail(userId: string, id: string) {
    const book = await this.prisma.travelBook.findUnique({
      where: { id },
      include: { _count: { select: { journals: true, spots: true } } },
    });
    if (!book) throw new NotFoundException('旅行册不存在');
    const member = await this.isMember(id, userId);
    if (!member && !book.bookIsPublic) throw new ForbiddenException('无权限查看');
    return {
      id: book.id,
      coverUrl: book.coverUrl,
      name: book.name,
      startTime: book.startTime,
      endTime: book.endTime,
      bookIsPublic: book.bookIsPublic,
      tripDays: this.tripDays(book.startTime, book.endTime),
      journalCount: book._count.journals,
      spotCount: book._count.spots,
    };
  }

  async stats(userId: string, id: string) {
    const detail = await this.detail(userId, id);
    return {
      journalCount: detail.journalCount,
      spotCount: detail.spotCount,
      tripDays: detail.tripDays,
    };
  }
}
