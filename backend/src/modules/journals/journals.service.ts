import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '../../common/exceptions/business.exception';

@Injectable()
export class JournalsService {
  constructor(private readonly prisma: PrismaService) {}

  private async isMember(bookId: string, userId: string) {
    const m = await this.prisma.travelBookMember.findUnique({
      where: { bookId_userId: { bookId, userId } },
    });
    return !!m;
  }

  // 权限过滤：作者本人可见全部（含私密）；册子其他成员仅见 isPublic=true
  private async canView(journal: any, userId: string) {
    if (journal.userId === userId) return true;
    const member = await this.isMember(journal.bookId, userId);
    return member && journal.isPublic;
  }

  async listByBook(userId: string, bookId: string, page = 1, pageSize = 10) {
    const journals = await this.prisma.journal.findMany({
      where: { bookId },
      include: { images: { orderBy: { sort: 'asc' } } },
      orderBy: { travelDate: 'desc' },
    });
    const filtered = [];
    for (const j of journals) {
      if (await this.canView(j, userId)) filtered.push(j);
    }
    const start = (page - 1) * pageSize;
    return {
      list: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  }

  async detail(userId: string, id: string) {
    const journal = await this.prisma.journal.findUnique({
      where: { id },
      include: { images: { orderBy: { sort: 'asc' } }, book: true },
    });
    if (!journal) throw new NotFoundException('游记不存在');
    if (!(await this.canView(journal, userId))) throw new ForbiddenException('无权限查看');
    return journal;
  }

  async create(userId: string, data: any) {
    const { imageList = [], ...rest } = data;
    const journal = await this.prisma.journal.create({
      data: {
        bookId: rest.bookId,
        spotId: rest.spotId,
        userId,
        title: rest.title,
        travelDate: new Date(rest.travelDate),
        weather: rest.weather,
        locationName: rest.locationName,
        content: rest.content,
        isPublic: rest.isPublic ?? false,
        images: {
          create: imageList.map((url: string, i: number) => ({ url, sort: i })),
        },
      },
      include: { images: true },
    });
    return journal;
  }

  async update(userId: string, id: string, data: any) {
    const journal = await this.prisma.journal.findUnique({ where: { id } });
    if (!journal) throw new NotFoundException('游记不存在');
    if (journal.userId !== userId) throw new ForbiddenException('仅作者可修改');
    const { imageList, ...rest } = data;
    return this.prisma.journal.update({
      where: { id },
      data: {
        title: rest.title,
        travelDate: rest.travelDate ? new Date(rest.travelDate) : undefined,
        weather: rest.weather,
        locationName: rest.locationName,
        content: rest.content,
        isPublic: rest.isPublic,
      },
    });
  }

  async remove(userId: string, id: string) {
    const journal = await this.prisma.journal.findUnique({ where: { id } });
    if (!journal) throw new NotFoundException('游记不存在');
    if (journal.userId !== userId) throw new ForbiddenException('仅作者可删除');
    await this.prisma.journal.delete({ where: { id } });
    return { success: true };
  }

  async uploadImages(journalId: string, urls: string[]) {
    const journal = await this.prisma.journal.findUnique({ where: { id: journalId } });
    if (!journal) throw new NotFoundException('游记不存在');
    await this.prisma.journalImage.createMany({
      data: urls.map((url, i) => ({ journalId, url, sort: i + 100 })),
    });
    return { urls };
  }

  async deleteImage(imageId: string) {
    await this.prisma.journalImage.delete({ where: { id: imageId } });
    return { success: true };
  }
}
