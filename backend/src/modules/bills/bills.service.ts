import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '../../common/exceptions/business.exception';

const CATEGORIES = ['餐饮', '交通', '住宿', '门票', '购物', '其他'];

@Injectable()
export class BillsService {
  constructor(private readonly prisma: PrismaService) {}

  private async isMember(ledgerId: string, userId: string) {
    const m = await this.prisma.ledgerMember.findUnique({
      where: { ledgerId_userId: { ledgerId, userId } },
    });
    return !!m;
  }

  async list(userId: string, ledgerId: string, page = 1, pageSize = 20, startDate?: string, endDate?: string) {
    if (!(await this.isMember(ledgerId, userId))) throw new ForbiddenException('无权限');
    const where: any = {
      ledgerId,
      billDate: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    };
    const [bills, total] = await Promise.all([
      this.prisma.bill.findMany({
        where,
        orderBy: { billDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.bill.count({ where }),
    ]);
    return { list: bills, total, page, pageSize };
  }

  async create(userId: string, data: any) {
    if (!(await this.isMember(data.ledgerId, userId))) throw new ForbiddenException('无权限');
    if (!CATEGORIES.includes(data.category)) {
      data.category = '其他';
    }
    return this.prisma.bill.create({
      data: {
        ledgerId: data.ledgerId,
        userId,
        category: data.category,
        subCategory: data.subCategory,
        billType: data.billType ?? 'expense',
        amount: data.amount,
        remark: data.remark,
        payWay: data.payWay,
        billDate: new Date(data.billDate),
      },
    });
  }

  async update(userId: string, id: string, data: any) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException('账单不存在');
    if (bill.userId !== userId) throw new ForbiddenException('仅记录者可修改');
    return this.prisma.bill.update({
      where: { id },
      data: {
        category: data.category,
        subCategory: data.subCategory,
        billType: data.billType,
        amount: data.amount,
        remark: data.remark,
        payWay: data.payWay,
        billDate: data.billDate ? new Date(data.billDate) : undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException('账单不存在');
    if (bill.userId !== userId) throw new ForbiddenException('仅记录者可删除');
    await this.prisma.bill.delete({ where: { id } });
    return { success: true };
  }
}
