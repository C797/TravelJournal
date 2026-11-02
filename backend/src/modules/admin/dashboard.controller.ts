import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('admin/dashboard')
@UseGuards(AuthGuard('admin-jwt'), RolesGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  /** 看板全量数据：统计卡 + 趋势 + 构成 + 最近用户 */
  @Get()
  summary() {
    return this.service.summary();
  }

  @Get('stats')
  stats() {
    return this.service.overview();
  }

  @Get('trend')
  trend(@Query('days') days?: string) {
    return this.service.trend(Number(days) || 7);
  }

  @Get('composition')
  composition() {
    return this.service.composition();
  }
}
