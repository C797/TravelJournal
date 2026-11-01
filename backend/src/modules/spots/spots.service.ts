import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '../../common/exceptions/business.exception';

@Injectable()
export class SpotsService {
  constructor(private readonly prisma: PrismaService) {}

  private async isMember(bookId: string, userId: string) {
    const m = await this.prisma.travelBookMember.findUnique({
      where: { bookId_userId: { bookId, userId } },
    });
    return !!m;
  }

  async listByBook(userId: string, bookId: string) {
    const book = await this.prisma.travelBook.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundException('旅行册不存在');
    if (!book.bookIsPublic && !(await this.isMember(bookId, userId))) {
      throw new ForbiddenException('无权限查看');
    }
    const spots = await this.prisma.mapSpot.findMany({
      where: { bookId },
      include: { _count: { select: { journals: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return spots.map((s) => ({
      ...s,
      journalCount: s._count.journals,
    }));
  }

  async create(userId: string, data: any) {
    const book = await this.prisma.travelBook.findUnique({ where: { id: data.bookId } });
    if (!book) throw new NotFoundException('旅行册不存在');
    if (!(await this.isMember(data.bookId, userId))) throw new ForbiddenException('无权限');
    return this.prisma.mapSpot.create({
      data: {
        bookId: data.bookId,
        locationName: data.locationName,
        province: data.province,
        city: data.city,
        longitude: data.longitude,
        latitude: data.latitude,
        markStatus: data.markStatus ?? 'planned',
        visitDate: data.visitDate ? new Date(data.visitDate) : undefined,
      },
    });
  }

  async update(userId: string, id: string, data: any) {
    const spot = await this.prisma.mapSpot.findUnique({ where: { id } });
    if (!spot) throw new NotFoundException('标注点不存在');
    if (!(await this.isMember(spot.bookId, userId))) throw new ForbiddenException('无权限');
    return this.prisma.mapSpot.update({
      where: { id },
      data: {
        locationName: data.locationName,
        province: data.province,
        city: data.city,
        longitude: data.longitude,
        latitude: data.latitude,
        markStatus: data.markStatus,
        visitDate: data.visitDate ? new Date(data.visitDate) : undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    const spot = await this.prisma.mapSpot.findUnique({ where: { id } });
    if (!spot) throw new NotFoundException('标注点不存在');
    if (!(await this.isMember(spot.bookId, userId))) throw new ForbiddenException('无权限');
    await this.prisma.mapSpot.delete({ where: { id } });
    return { success: true };
  }
}
