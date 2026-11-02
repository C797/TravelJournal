import {
  Body, Controller, Get, Ip, Param, Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminSystemService } from './admin-system.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import type { AdminPayload } from '../../common/decorators/current-admin.decorator';

// ==================== 系统设置 ====================
@Controller('admin/system')
@UseGuards(AuthGuard('admin-jwt'), RolesGuard)
export class AdminSystemController {
  constructor(private readonly service: AdminSystemService) {}

  @Get('configs')
  getConfigs() {
    return this.service.getConfigs();
  }

  @Put('configs')
  @Roles('super', 'admin')
  saveConfigs(
    @CurrentAdmin() admin: AdminPayload,
    @Body() body: Record<string, any>,
    @Ip() ip: string,
  ) {
    return this.service.saveConfigs(admin, body, ip);
  }
}

// ==================== 操作日志 ====================
@Controller('admin/logs')
@UseGuards(AuthGuard('admin-jwt'), RolesGuard)
export class AdminLogsController {
  constructor(private readonly service: AdminSystemService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('module') module?: string,
    @Query('keyword') keyword?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.listLogs({ page, pageSize, module, keyword, startDate, endDate });
  }
}

// ==================== 管理员账号 ====================
@Controller('admin/accounts')
@UseGuards(AuthGuard('admin-jwt'), RolesGuard)
@Roles('super')
export class AdminAccountsController {
  constructor(private readonly service: AdminSystemService) {}

  @Get()
  list() {
    return this.service.listAdmins();
  }

  @Post()
  create(
    @CurrentAdmin() admin: AdminPayload,
    @Body() body: { account: string; password: string; name: string; role?: string },
    @Ip() ip: string,
  ) {
    return this.service.createAdmin(admin, body, ip);
  }

  @Put(':id/password')
  resetPassword(
    @CurrentAdmin() admin: AdminPayload,
    @Param('id') id: string,
    @Body() body: { password: string },
    @Ip() ip: string,
  ) {
    return this.service.resetPassword(admin, id, body.password, ip);
  }

  @Put(':id/status')
  updateStatus(
    @CurrentAdmin() admin: AdminPayload,
    @Param('id') id: string,
    @Body() body: { status: string },
    @Ip() ip: string,
  ) {
    return this.service.updateAdminStatus(admin, id, body.status, ip);
  }
}
