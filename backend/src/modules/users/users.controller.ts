import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: any) {
    return this.usersService.getMe(req.user.id);
  }

  @Put('me')
  updateMe(
    @Req() req: any,
    @Body() body: { nickname?: string; avatar?: string; signature?: string },
  ) {
    return this.usersService.updateMe(req.user.id, body);
  }

  @Get('me/stats')
  getStats(@Req() req: any) {
    return this.usersService.getMyStats(req.user.id);
  }

  @Get('me/export')
  exportData(@Req() req: any) {
    return this.usersService.exportMyData(req.user.id);
  }
}
