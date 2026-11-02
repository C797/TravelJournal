import { Body, Controller, Get, Put, Query, Req, UseGuards } from '@nestjs/common';
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

  /** 我的全部标注点（首页足迹地图） */
  @Get('me/spots')
  mySpots(@Req() req: any) {
    return this.usersService.mySpots(req.user.id);
  }

  /** 我的最近游记（首页最近故事） */
  @Get('me/journals')
  myJournals(@Req() req: any, @Query('limit') limit?: string) {
    return this.usersService.myJournals(req.user.id, Number(limit) || 5);
  }

  /** 可邀请的人（共同旅行册成员） */
  @Get('me/friends')
  myFriends(@Req() req: any) {
    return this.usersService.myFriends(req.user.id);
  }

  @Get('me/export')
  exportData(@Req() req: any) {
    return this.usersService.exportMyData(req.user.id);
  }
}
