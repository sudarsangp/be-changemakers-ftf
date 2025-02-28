/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('ngo/:name')
  getNgoName(@Param('name') name) {
    return this.appService.getNgoByName(name);
  }

  @Get('volunteer/:name')
  getVolunteerName(@Param('name') name) {
    return this.appService.getVolunteerByName(name);
  }

  @Get('bedrock')
  getModels() {
    return this.appService.connectToBedrock();
  }
}
