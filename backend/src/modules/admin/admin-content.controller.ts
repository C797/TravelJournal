import {
  Body, Controller, Delete, Get, Ip, Param, Put, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminContentService } from './admin-content.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import type { AdminPayload } from '../../common/decorators/current-admin.decorator';

// ==================== 旅行册管理 ====================
@Controller('admin/travel-books')
@UseGuards(AuthGuard('admin-jwt'), RolesGuard)
export class AdminBooksController {
  constructor(private readonly service: AdminContentService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listBooks({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      keyword,
      status,
    });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.bookDetail(id);
  }

  @Put(':id/status')
  updateStatus(
    @CurrentAdmin() admin: AdminPayload,
    @Param('id') id: string,
    @Body() body: { status: string },
    @Ip() ip: string,
  ) {
    return this.service.updateBookStatus(admin, id, body.status, ip);
  }

  @Delete(':id')
  @Roles('super', 'admin')
  remove(@CurrentAdmin() admin: AdminPayload, @Param('id') id: string, @Ip() ip: string) {
    return this.service.removeBook(admin, id, ip);
  }
}

// ==================== 游记管理 ====================
@Controller('admin/journals')
@UseGuards(AuthGuard('admin-jwt'), RolesGuard)
export class AdminJournalsController {
  constructor(private readonly service: AdminContentService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('auditStatus') auditStatus?: string,
  ) {
    return this.service.listJournals({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      keyword,
      auditStatus,
    });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.journalDetail(id);
  }

  /** 审核：pass / reject / pending */
  @Put(':id/audit')
  audit(
    @CurrentAdmin() admin: AdminPayload,
    @Param('id') id: string,
    @Body() body: { auditStatus: string },
    @Ip() ip: string,
  ) {
    return this.service.auditJournal(admin, id, body.auditStatus, ip);
  }

  @Delete(':id')
  @Roles('super', 'admin')
  remove(@CurrentAdmin() admin: AdminPayload, @Param('id') id: string, @Ip() ip: string) {
    return this.service.removeJournal(admin, id, ip);
  }
}

// ==================== 账本管理 ====================
@Controller('admin/ledgers')
@UseGuards(AuthGuard('admin-jwt'), RolesGuard)
export class AdminLedgersController {
  constructor(private readonly service: AdminContentService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listLedgers({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      keyword,
      status,
    });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.ledgerDetail(id);
  }

  @Put(':id/status')
  updateStatus(
    @CurrentAdmin() admin: AdminPayload,
    @Param('id') id: string,
    @Body() body: { status: string },
    @Ip() ip: string,
  ) {
    return this.service.updateLedgerStatus(admin, id, body.status, ip);
  }

  @Delete(':id')
  @Roles('super', 'admin')
  remove(@CurrentAdmin() admin: AdminPayload, @Param('id') id: string, @Ip() ip: string) {
    return this.service.removeLedger(admin, id, ip);
  }
}
