import { Body, Controller, Get, Post, Redirect } from '@nestjs/common';
import { UserAuthDto } from 'src/dtos';
import { Helpers } from 'src/helpers';

@Controller('auth')
export class AuthController {
  // constructor(private readonly UserService: UserService) {}

  @Get('/docs')
  @Redirect('https://documenter.getpostman.com/view/10509620/VUqpsx5F')
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  getDocs(): void {}

  @Post('/login')
  async authenticateUser(@Body() requestDto: UserAuthDto): Promise<Response> {
    try {
      return Helpers.success(requestDto, 'User created successfully');
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'BAD_REQUEST');
    }
  }
}
