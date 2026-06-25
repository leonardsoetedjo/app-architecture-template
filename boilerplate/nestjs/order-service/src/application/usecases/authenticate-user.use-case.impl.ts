import { Injectable, Inject } from '@nestjs/common';
import { IAuthenticateUserUseCase } from './authenticate-user.use-case.interface';
import { LoginCommand, LoginResult } from '../dtos/auth.dto';
import { IUserRepository } from '../../domain/ports/user-repository.port';
import { IPasswordHasher } from '../../domain/ports/password-hasher.port';
import { ITokenGenerator } from '../../domain/ports/token-generator.port';
import { IEventPublisher } from '../../domain/ports/event-publisher.port';
import { Email } from '../../domain/models/email.value-object';
import { AuthenticationException } from '../../domain/exceptions/auth.exception';
import { UserLoggedInEvent } from '../../domain/events/user-logged-in.event';

@Injectable()
export class AuthenticateUserUseCaseImpl implements IAuthenticateUserUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
        @Inject('IPasswordHasher')
        private readonly passwordHasher: IPasswordHasher,
        @Inject('ITokenGenerator')
        private readonly tokenGenerator: ITokenGenerator,
        @Inject('IEventPublisher')
        private readonly eventPublisher: IEventPublisher,
    ) {}

    async execute(command: LoginCommand): Promise<LoginResult> {
        if (!command) {
            throw new Error('Command must not be null');
        }

        const email = new Email(command.email);
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            throw new AuthenticationException('AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
        }

        const isAuthenticated = await user.authenticate(command.password, this.passwordHasher);

        if (!isAuthenticated) {
            throw new AuthenticationException('AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
        }

        user.recordLogin();
        await this.userRepository.save(user);

        const accessToken = this.tokenGenerator.generateAccessToken(user);
        const refreshToken = this.tokenGenerator.generateRefreshToken(user);

        await this.eventPublisher.publish(new UserLoggedInEvent(user.id.getValue()));

        return {
            accessToken,
            refreshToken,
            email: user.email.getValue(),
            roles: user.roles,
            tokenType: 'Bearer',
        };
    }
}
