import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BillsService } from './bills.service';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class BillsController {
  constructor(private readonly service: BillsService) {}

  @Get('ledgers/:id/bills')
  list(
    @Req() req: any,
    @Param('id') ledgerId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.list(req.user.id, ledgerId, Number(page) || 1, Number(pageSize) || 20, startDate, endDate);
  }

  @Post('bills')
  create(@Req() req: any, @Body() body: any) {
    return this.service.create(req.user.id, body);
  }

  @Put('bills/:id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.update(req.user.id, id, body);
  }

  @Delete('bills/:id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }
}
