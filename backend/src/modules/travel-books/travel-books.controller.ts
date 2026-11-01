import {
  Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TravelBooksService } from './travel-books.service';

@Controller('travel-books')
@UseGuards(AuthGuard('jwt'))
export class TravelBooksController {
  constructor(private readonly service: TravelBooksService) {}

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user.id);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.service.create(req.user.id, body);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.update(req.user.id, id, body);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }

  @Get(':id')
  detail(@Req() req: any, @Param('id') id: string) {
    return this.service.detail(req.user.id, id);
  }

  @Get(':id/stats')
  stats(@Req() req: any, @Param('id') id: string) {
    return this.service.stats(req.user.id, id);
  }
}
