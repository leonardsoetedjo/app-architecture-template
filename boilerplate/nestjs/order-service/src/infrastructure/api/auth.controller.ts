import { Controller, Post, Get, Body, HttpCode, HttpStatus, Inject, Headers, UnauthorizedException } from '@nestjs/common';
import { IAuthenticateUserUseCase } from '../../application/usecases/authenticate-user.use-case.interface';
import { IRegisterUserUseCase } from '../../application/usecases/register-user.use-case.interface';
import { IGetCurrentUserUseCase } from '../../application/usecases/get-current-user.use-case.interface';
import { ITokenParser } from '../../domain/ports/token-parser.port';
import { LoginCommand, LoginResult } from '../../application/dtos/auth.dto';
import { RegisterCommand, RegisterResult } from '../../application/dtos/user-order.dto';
import { UserProfileResult } from '../../application/dtos/user-order.dto';
import { UserId } from '../../domain/models/user-id.value-object';

@Controller('api/v1/auth')
export class AuthController {
    constructor(
        @Inject('IAuthenticateUserUseCase')
        private readonly authenticateUserUseCase: IAuthenticateUserUseCase,
        @Inject('IRegisterUserUseCase')
        private readonly registerUserUseCase: IRegisterUserUseCase,
        @Inject('IGetCurrentUserUseCase')
        private readonly getCurrentUserUseCase: IGetCurrentUserUseCase,
        @Inject('ITokenParser')
        private readonly tokenParser: ITokenParser,
    ) {}

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() command: RegisterCommand): Promise<RegisterResult> {
        return this.registerUserUseCase.execute(command);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() command: LoginCommand): Promise<LoginResult> {
        return this.authenticateUserUseCase.execute(command);
    }

    @Get('me')
    @HttpCode(HttpStatus.OK)
    async me(@Headers('authorization') authHeader: string): Promise<UserProfileResult> {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Authentication required');
        }
        const token = authHeader.split(' ')[1];
        const userId = this.tokenParser.parseUserId(token);
        if (!userId) {
            throw new UnauthorizedException('Invalid token');
        }
        return this.getCurrentUserUseCase.execute(userId);
    }
}
