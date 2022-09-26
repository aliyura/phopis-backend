import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { ResourceService } from '../../../services/resource/resource.service';
import {
  ResourceDto,
  ResourceStatusUpdateDto,
  UpdateResourceDto,
} from '../../../dtos/resource.dto';
import { Helpers } from 'src/helpers';
import { AppGuard } from 'src/services/auth/app.guard';
import { AuthUserDto } from '../../../dtos/user.dto';
import { JwtService } from '@nestjs/jwt';
import { ResourceOwnershipChangeDto } from '../../../dtos/resource.dto';

@Controller('resource')
export class ResourceController {
  constructor(
    private resourceService: ResourceService,
    private jwtService: JwtService,
  ) {}

  @Get('/docs')
  @Redirect('https://documenter.getpostman.com/view/10509620/VUqpsx5F')
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  getDocs(): void {}

  @UseGuards(AppGuard)
  @Post('/')
  async createResource(
    @Headers('Authorization') token: string,
    @Body() requestDto: ResourceDto,
  ): Promise<ApiResponse> {
    try {
      const authToken = token.substring(7);
      const user = (await this.jwtService.decode(authToken)) as AuthUserDto;

      const response = await this.resourceService.createResource(
        user,
        requestDto,
      );
      if (response.success) {
        return response;
      }
      return Helpers.failedHttpResponse(
        response.message,
        HttpStatus.BAD_REQUEST,
      );
    } catch (ex) {
      console.log('An error occurred:', ex);
      return Helpers.failedHttpResponse(
        'Something went wrong',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @UseGuards(AppGuard)
  @Put('/:resourceId')
  async updateResource(
    @Headers('Authorization') token: string,
    @Param('resourceId') resourceId: string,
    @Body() requestDto: UpdateResourceDto,
  ): Promise<ApiResponse> {
    try {
      const authToken = token.substring(7);
      const user = (await this.jwtService.decode(authToken)) as AuthUserDto;

      const response = await this.resourceService.updateResource(
        user,
        resourceId,
        requestDto,
      );
      if (response.success) {
        return response;
      }
      return Helpers.failedHttpResponse(
        response.message,
        HttpStatus.BAD_REQUEST,
      );
    } catch (ex) {
      console.log('An error occurred:', ex);
      return Helpers.failedHttpResponse(
        'Something went wrong',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @UseGuards(AppGuard)
  @Put('/status/update/:resourceId')
  async updateResourceStatus(
    @Headers('Authorization') token: string,
    @Param('resourceId') resourceId: string,
    @Query('status') status: string,

    @Body() requestDto: ResourceStatusUpdateDto,
  ): Promise<ApiResponse> {
    try {
      const authToken = token.substring(7);
      const user = (await this.jwtService.decode(authToken)) as AuthUserDto;

      const response = await this.resourceService.updateResourceStatus(
        user,
        resourceId,
        status,
        requestDto,
      );
      if (response.success) {
        return response;
      }
      return Helpers.failedHttpResponse(
        response.message,
        HttpStatus.BAD_REQUEST,
      );
    } catch (ex) {
      console.log('An error occurred:', ex);
      return Helpers.failedHttpResponse(
        'Something went wrong',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @UseGuards(AppGuard)
  @Put('/ownership/change/:resourceId')
  async changeResourceOwnership(
    @Headers('Authorization') token: string,
    @Param('resourceId') resourceId: string,
    @Body() requestDto: ResourceOwnershipChangeDto,
  ): Promise<ApiResponse> {
    try {
      const authToken = token.substring(7);
      const user = (await this.jwtService.decode(authToken)) as AuthUserDto;

      const response = await this.resourceService.changeResourceOwnership(
        user,
        resourceId,
        requestDto,
      );
      if (response.success) {
        return response;
      }
      return Helpers.failedHttpResponse(
        response.message,
        HttpStatus.BAD_REQUEST,
      );
    } catch (ex) {
      console.log('An error occurred:', ex);
      return Helpers.failedHttpResponse(
        'Something went wrong',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @UseGuards(AppGuard)
  @Get('/')
  async getMyResources(
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    try {
      const authToken = token.substring(7);
      const user = (await this.jwtService.decode(authToken)) as AuthUserDto;

      const response = await this.resourceService.getMyResources(user);
      if (response.success) {
        return response;
      }
      return Helpers.failedHttpResponse(
        response.message,
        HttpStatus.BAD_REQUEST,
      );
    } catch (ex) {
      console.log('An error occurred:', ex);
      return Helpers.failedHttpResponse(
        'Something went wrong',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @UseGuards(AppGuard)
  @Get('/:ruid')
  async getResourceByRuid(
    @Headers('Authorization') token: string,
    @Param('ruid') ruid: string,
  ): Promise<ApiResponse> {
    try {
      const authToken = token.substring(7);
      const user = (await this.jwtService.decode(authToken)) as AuthUserDto;

      const response = await this.resourceService.getResourceByRuid(user, ruid);
      if (response.success) {
        return response;
      }
      return Helpers.failedHttpResponse(
        response.message,
        HttpStatus.BAD_REQUEST,
      );
    } catch (ex) {
      console.log('An error occurred:', ex);
      return Helpers.failedHttpResponse(
        'Something went wrong',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @UseGuards(AppGuard)
  @Get('/search/byidentity/:identityNumber')
  async getResourceByIdentityNumber(
    @Headers('Authorization') token: string,
    @Param('identityNumber') identityNumber: string,
  ): Promise<ApiResponse> {
    try {
      const authToken = token.substring(7);
      const user = (await this.jwtService.decode(authToken)) as AuthUserDto;

      const response = await this.resourceService.getResourceByIdentityNumber(
        user,
        identityNumber,
      );
      if (response.success) {
        return response;
      }
      return Helpers.failedHttpResponse(
        response.message,
        HttpStatus.BAD_REQUEST,
      );
    } catch (ex) {
      console.log('An error occurred:', ex);
      return Helpers.failedHttpResponse(
        'Something went wrong',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }
  @UseGuards(AppGuard)
  @Get('/search/byserial/:serialNumber')
  async getResourceBySerialNumber(
    @Headers('Authorization') token: string,
    @Param('serialNumber') serialNumber: string,
  ): Promise<ApiResponse> {
    try {
      const authToken = token.substring(7);
      const user = (await this.jwtService.decode(authToken)) as AuthUserDto;

      const response = await this.resourceService.getResourceBySerialNumber(
        user,
        serialNumber,
      );
      if (response.success) {
        return response;
      }
      return Helpers.failedHttpResponse(
        response.message,
        HttpStatus.BAD_REQUEST,
      );
    } catch (ex) {
      console.log('An error occurred:', ex);
      return Helpers.failedHttpResponse(
        'Something went wrong',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @UseGuards(AppGuard)
  @Get('/search/bycode/:code')
  async getResourceByCode(
    @Headers('Authorization') token: string,
    @Param('code') code: string,
  ): Promise<ApiResponse> {
    try {
      const authToken = token.substring(7);
      const user = (await this.jwtService.decode(authToken)) as AuthUserDto;

      const response = await this.resourceService.getResourceByCode(user, code);
      if (response.success) {
        return response;
      }
      return Helpers.failedHttpResponse(
        response.message,
        HttpStatus.BAD_REQUEST,
      );
    } catch (ex) {
      console.log('An error occurred:', ex);
      return Helpers.failedHttpResponse(
        'Something went wrong',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }
}
