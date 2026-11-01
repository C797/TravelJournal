import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvitationsService } from './invitations.service';

@Controller('invitations')
@UseGuards(AuthGuard('jwt'))
export class InvitationsController {
  constructor(private readonly service: InvitationsService) {}

  @Post()
  generate(@Req() req: any, @Body() body: { ledgerId: string; expireHours?: number }) {
    return this.service.generate(req.user.id, body.ledgerId, body.expireHours);
  }

  @Post('verify')
  verify(@Body() body: { code: string }) {
    return this.service.verify(body.code);
  }

  @Post('join')
  join(@Req() req: any, @Body() body: { code: string }) {
    return this.service.join(req.user.id, body.code);
  }
}
