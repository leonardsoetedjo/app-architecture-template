import { Controller, Post, Get, Body, HttpCode, HttpStatus, Inject, Headers, UnauthorizedException, Res } from '@nestjs/common';
import { Response } from 'express';
import { IAuthenticateUserUseCase } from '../../application/usecases/authenticate-user.use-case.interface';
import { IRegisterUserUseCase } from '../../application/usecases/register-user.use-case.interface';
import { IGetCurrentUserUseCase } from '../../application/usecases/get-current-user.use-case.interface';
import { ITokenParser } from '../../domain/ports/token-parser.port';
import { LoginCommand, LoginResult } from '../../application/dtos/auth.dto';
import { RefreshTokenCommand, RefreshTokenResult } from '../../application/dtos/refresh-token.dto';
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
    async login(
        @Body() command: LoginCommand,
        @Res({ passthrough: true }) response: Response,
    ): Promise<LoginResult> {
        const result = await this.authenticateUserUseCase.execute(command);
        // Set httpOnly cookies for token storage
        response.cookie('access_token', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600 * 1000, // 1 hour
        });
        response.cookie('refresh_token', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 3600 * 1000, // 24 hours
        });
        return result;
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Body() command: RefreshTokenCommand,
        @Res({ passthrough: true }) response: Response,
    ): Promise<RefreshTokenResult> {
        // TODO: Implement RefreshTokenUseCase
        // For now, return a placeholder that passes through the command
        const result: RefreshTokenResult = {
            accessToken: 'new-access-token-placeholder',
            refreshToken: command.refreshToken,
            email: '',
            roles: [],
            tokenType: 'Bearer',
        };
        response.cookie('access_token', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600 * 1000,
        });
        return result;
    }

    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(@Res({ passthrough: true }) response: Response): Promise<void> {
        response.clearCookie('access_token');
        response.clearCookie('refresh_token');
        // TODO: Add token blacklist / Redis revocation
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
