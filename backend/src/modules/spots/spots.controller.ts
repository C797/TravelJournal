import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SpotsService } from './spots.service';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class SpotsController {
  constructor(private readonly service: SpotsService) {}

  @Get('travel-books/:id/spots')
  listByBook(@Req() req: any, @Param('id') bookId: string) {
    return this.service.listByBook(req.user.id, bookId);
  }

  @Post('spots')
  create(@Req() req: any, @Body() body: any) {
    return this.service.create(req.user.id, body);
  }

  @Put('spots/:id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.update(req.user.id, id, body);
  }

  @Delete('spots/:id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }
}
