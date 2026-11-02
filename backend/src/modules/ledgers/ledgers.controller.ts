import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LedgersService } from './ledgers.service';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class LedgersController {
  constructor(private readonly service: LedgersService) {}

  /**
   * 新建/更新账本。
   * 账本与旅行册是 1:1 关系：同一旅行册再次创建视为改名 + 同步成员。
   */
  @Post('ledgers')
  create(
    @Req() req: any,
    @Body()
    body: {
      bookId: string;
      name: string;
      isPublic?: boolean;
      memberIds?: string[];
    },
  ) {
    return this.service.createOrUpdate(req.user.id, body);
  }

  @Get('travel-books/:id/ledger')
  getByBook(@Req() req: any, @Param('id') bookId: string) {
    return this.service.getByBook(req.user.id, bookId);
  }

  @Get('ledgers/:id/members')
  members(@Req() req: any, @Param('id') ledgerId: string) {
    return this.service.members(req.user.id, ledgerId);
  }

  @Delete('ledgers/:id/members/:userId')
  removeMember(@Req() req: any, @Param('id') ledgerId: string, @Param('userId') userId: string) {
    return this.service.removeMember(req.user.id, ledgerId, userId);
  }

  @Get('ledgers/:id/stats')
  stats(@Req() req: any, @Param('id') ledgerId: string, @Query('scope') scope?: string) {
    return this.service.stats(req.user.id, ledgerId, (scope as any) || 'month');
  }

  @Get('ledgers/:id/export')
  exportBills(
    @Req() req: any,
    @Param('id') ledgerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.exportBills(req.user.id, ledgerId, startDate, endDate);
  }
}
