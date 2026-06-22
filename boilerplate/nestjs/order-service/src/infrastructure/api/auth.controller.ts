import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { IAuthenticateUserUseCase } from '../../application/usecases/authenticate-user.use-case.interface';
import { LoginCommand, LoginResult } from '../../application/dtos/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authenticateUserUseCase: IAuthenticateUserUseCase) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() command: LoginCommand): Promise<LoginResult> {
        return this.authenticateUserUseCase.execute(command);
    }
}
