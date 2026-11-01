import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, NotFoundException, ForbiddenException } from '../../common/exceptions/business.exception';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  private genCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return `${s.slice(0, 2)}${s.slice(2, 4)} ${Math.floor(10 + Math.random() * 90)}`;
  }

  async generate(userId: string, ledgerId: string, expireHours = 72) {
    const ledger = await this.prisma.ledger.findUnique({ where: { id: ledgerId } });
    if (!ledger) throw new NotFoundException('账本不存在');
    if (ledger.ownerId !== userId) throw new ForbiddenException('仅创建者可生成邀请码');
    const expireAt = new Date(Date.now() + expireHours * 3600 * 1000);
    return this.prisma.invitation.create({
      data: { code: this.genCode(), ledgerId, creatorId: userId, expireAt },
    });
  }

  async verify(code: string) {
    const inv = await this.prisma.invitation.findUnique({ where: { code } });
    if (!inv || inv.used) throw new BusinessException(1003, '邀请码无效');
    if (inv.expireAt < new Date()) throw new BusinessException(1004, '邀请码已过期');
    const ledger = await this.prisma.ledger.findUnique({
      where: { id: inv.ledgerId },
      include: { book: true },
    });
    return { ledgerName: ledger?.name, bookName: ledger?.book?.name };
  }

  async join(userId: string, code: string) {
    const inv = await this.prisma.invitation.findUnique({ where: { code } });
    if (!inv || inv.used) throw new BusinessException(1003, '邀请码无效');
    if (inv.expireAt < new Date()) throw new BusinessException(1004, '邀请码已过期');

    const existing = await this.prisma.ledgerMember.findUnique({
      where: { ledgerId_userId: { ledgerId: inv.ledgerId, userId } },
    });
    if (existing) throw new BusinessException(1005, '你已在该账本中');

    await this.prisma.$transaction([
      this.prisma.ledgerMember.create({
        data: { ledgerId: inv.ledgerId, userId, role: 'member' },
      }),
      this.prisma.invitation.update({
        where: { id: inv.id },
        data: { used: true, usedBy: userId, usedAt: new Date() },
      }),
    ]);
    return { success: true, ledgerId: inv.ledgerId };
  }
}
