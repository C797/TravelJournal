import { Body, Controller, Delete, Get, Ip, Param, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminUsersService } from './admin-users.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import type { AdminPayload } from '../../common/decorators/current-admin.decorator';

@Controller('admin/users')
@UseGuards(AuthGuard('admin-jwt'), RolesGuard)
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    return this.service.list({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      keyword,
      status,
    });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Put(':id/status')
  updateStatus(
    @CurrentAdmin() admin: AdminPayload,
    @Param('id') id: string,
    @Body() body: { status: string },
    @Ip() ip: string,
  ) {
    return this.service.updateStatus(admin, id, body.status, ip);
  }

  @Delete(':id')
  @Roles('super', 'admin')
  remove(@CurrentAdmin() admin: AdminPayload, @Param('id') id: string, @Ip() ip: string) {
    return this.service.remove(admin, id, ip);
  }
}
