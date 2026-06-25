import { Injectable, Inject } from '@nestjs/common';
import { IGetCurrentUserUseCase } from './get-current-user.use-case.interface';
import { UserProfileResult } from '../dtos/user-order.dto';
import { UserId } from '../../domain/models/user-id.value-object';
import { IUserRepository } from '../../domain/ports/user-repository.port';
import { AuthenticationException } from '../../domain/exceptions/auth.exception';

@Injectable()
export class GetCurrentUserUseCaseImpl implements IGetCurrentUserUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(userId: UserId): Promise<UserProfileResult> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new AuthenticationException('AUTH_USER_NOT_FOUND', 'User not found');
        }

        return {
            userId: user.id.getValue(),
            email: user.email.getValue(),
            roles: user.roles,
            enabled: user.enabled,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
        };
    }
}
