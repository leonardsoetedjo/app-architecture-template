import { Injectable, Inject } from '@nestjs/common';

import { IRefreshTokenUseCase } from './refresh-token.use-case.interface';
import { AuthenticationException } from '../../domain/exceptions/auth.exception';
import { ITokenGenerator } from '../../domain/ports/token-generator.port';
import { ITokenParser } from '../../domain/ports/token-parser.port';
import { IUserRepository } from '../../domain/ports/user-repository.port';
import { RefreshTokenCommand, RefreshTokenResult } from '../dtos/refresh-token.dto';

@Injectable()
export class RefreshTokenUseCaseImpl implements IRefreshTokenUseCase {
    constructor(
        @Inject('ITokenParser')
        private readonly tokenParser: ITokenParser,
        @Inject('ITokenGenerator')
        private readonly tokenGenerator: ITokenGenerator,
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
        if (!command?.refreshToken) {
            throw new Error('refreshToken must not be null or blank');
        }

        if (!this.tokenParser.isValid(command.refreshToken)) {
            throw new AuthenticationException('AUTH_INVALID_TOKEN', 'Invalid or expired refresh token');
        }

        const userId = this.tokenParser.parseUserId(command.refreshToken);
        if (!userId) {
            throw new AuthenticationException('AUTH_INVALID_TOKEN', 'Could not parse user from token');
        }

        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new AuthenticationException('AUTH_USER_NOT_FOUND', 'User not found');
        }

        // Token rotation: generate new pair
        const newAccessToken = this.tokenGenerator.generateAccessToken(user);
        const newRefreshToken = this.tokenGenerator.generateRefreshToken(user);

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            email: user.email.getValue(),
            roles: Array.from(user.roles),
            tokenType: 'Bearer',
        };
    }
}
