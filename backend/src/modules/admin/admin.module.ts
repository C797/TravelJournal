import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminBooksController, AdminJournalsController, AdminLedgersController } from './admin-content.controller';
import { AdminContentService } from './admin-content.service';
import { AdminSystemController, AdminLogsController, AdminAccountsController } from './admin-system.controller';
import { AdminSystemService } from './admin-system.service';
import { OperationLogService } from './operation-log.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [PrismaModule],
  controllers: [
    DashboardController,
    AdminUsersController,
    AdminBooksController,
    AdminJournalsController,
    AdminLedgersController,
    AdminSystemController,
    AdminLogsController,
    AdminAccountsController,
  ],
  providers: [
    DashboardService,
    AdminUsersService,
    AdminContentService,
    AdminSystemService,
    OperationLogService,
    RolesGuard,
  ],
  exports: [OperationLogService],
})
export class AdminModule {}
