import { Module } from '@nestjs/common';
import { TravelBooksService } from './travel-books.service';
import { TravelBooksController } from './travel-books.controller';

@Module({
  providers: [TravelBooksService],
  controllers: [TravelBooksController],
})
export class TravelBooksModule {}
