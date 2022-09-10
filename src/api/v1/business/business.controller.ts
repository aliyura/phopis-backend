import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { UserDto } from 'src/dtos';
import { BusinessBodyDto, BusinessDto } from 'src/dtos/business.dto';
import { Status, UserRole } from 'src/enums';
import { Helpers } from 'src/helpers';
import { BusinessService } from 'src/services/business/business.service';
import { UserService } from 'src/services/user/user.service';

@Controller('business')
export class BusinessController {
  cryptoService: any;
  constructor(
    private readonly businessService: BusinessService,
    private readonly userService: UserService,
  ) {}

  @Get('/docs')
  @Redirect('https://')
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  getDocs(): void {}

  @Get('/')
  async getAlllBusiness(): Promise<Response> {
    return null;
  }

  @Post('/')
  async createBusiness(@Body() bodyDto: BusinessBodyDto): Promise<Response> {
    try {
      // Check if business exist
      //   const existBusiness = await this.businessService.existByPhoneOrEmail(
      //     bodyDto.email,
      //     bodyDto.phone,
      //   );
      const existBusiness = await this.businessService.businessExist(
        bodyDto.businessName,
      );

      if (existBusiness)
        return Helpers.error('Business already exist', 'BAD_REQUEST');

      // Check if user account exist or not
      const existingUser = await this.userService.existByPhoneOrEmail(
        bodyDto.phone,
        bodyDto.email,
      );
      if (existingUser)
        return Helpers.error('User Account already exist', 'BAD_REQUEST');


      // Good to go, create business and user 
      const businessId = `BTI${Helpers.getUniqueId()}`;

      const businessRequest = {
        businessName: bodyDto.businessName,
        email: bodyDto.email,
        phone: bodyDto.phone,
        state: bodyDto.state,
        lga: bodyDto.lga,
        address: bodyDto.address,
        identityType: bodyDto.identityType,
        identityNumber: bodyDto.identityNumber,
        status: Status.INACTIVE,
        // role: '',
        businessId: businessId,
        logo: bodyDto.logo,
      } as any;
      const createResult = await this.businessService.createBusiness(businessRequest);

      //   User data
      //encrypt password
      //   const hash = await this.cryptoService.encrypt(bodyDto.password);
      //   bodyDto.password = hash;

    //   const userData = {
    //     name: bodyDto.name,
    //     type: 'owner',
    //     email: bodyDto.email,
    //     phone: bodyDto.phone,
    //     state: bodyDto.state,
    //     lga: bodyDto.lga,
    //     street: '',
    //     regNumber: '',
    //     target: '',
    //     password: '',
    //     status: Status.INACTIVE,
    //     role: UserRole.BUSINESS,
    //     businessId: bodyDto.businessId,
    //   } as any;
    //   const createUser = await this.userService.createUser(userData);

      return Helpers.success({}, 'Success');
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'BAD_REQUEST');
    }
  }
}
