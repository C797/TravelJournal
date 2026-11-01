import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JournalsService } from './journals.service';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class JournalsController {
  constructor(private readonly service: JournalsService) {}

  @Get('travel-books/:id/journals')
  listByBook(
    @Req() req: any,
    @Param('id') bookId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.listByBook(req.user.id, bookId, Number(page) || 1, Number(pageSize) || 10);
  }

  @Get('journals/:id')
  detail(@Req() req: any, @Param('id') id: string) {
    return this.service.detail(req.user.id, id);
  }

  @Post('journals')
  create(@Req() req: any, @Body() body: any) {
    return this.service.create(req.user.id, body);
  }

  @Put('journals/:id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.update(req.user.id, id, body);
  }

  @Delete('journals/:id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }

  @Post('journals/:id/images')
  uploadImages(@Param('id') id: string, @Body() body: { urls: string[] }) {
    return this.service.uploadImages(id, body.urls);
  }

  @Delete('journals/images/:imageId')
  deleteImage(@Param('imageId') imageId: string) {
    return this.service.deleteImage(imageId);
  }
}
