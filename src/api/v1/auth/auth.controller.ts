import { Body, Controller, Get, Post, Redirect } from '@nestjs/common';
import { UserAuthDto } from 'src/dtos';
import { Helpers } from 'src/helpers';
import { AuthService } from '../../../services/auth/auth.service';
import { ApiResponse } from '../../../dtos/ApiResponse.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/docs')
  @Redirect('https://documenter.getpostman.com/view/10509620/VUqpsx5F')
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  getDocs(): void {}

  @Post('/login')
  async authenticateUser(
    @Body() requestDto: UserAuthDto,
  ): Promise<ApiResponse> {
    const response = await this.authService.login(requestDto);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, 'UNAUTHORIZED');
  }
}
