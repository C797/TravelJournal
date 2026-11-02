import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TravelBooksModule } from './modules/travel-books/travel-books.module';
import { SpotsModule } from './modules/spots/spots.module';
import { JournalsModule } from './modules/journals/journals.module';
import { LedgersModule } from './modules/ledgers/ledgers.module';
import { BillsModule } from './modules/bills/bills.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { HealthModule } from './modules/health/health.module';
import { UploadModule } from './modules/upload/upload.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TravelBooksModule,
    SpotsModule,
    JournalsModule,
    LedgersModule,
    BillsModule,
    InvitationsModule,
    UploadModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
