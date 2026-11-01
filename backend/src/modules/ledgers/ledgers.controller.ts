import { Controller, Delete, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LedgersService } from './ledgers.service';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class LedgersController {
  constructor(private readonly service: LedgersService) {}

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
