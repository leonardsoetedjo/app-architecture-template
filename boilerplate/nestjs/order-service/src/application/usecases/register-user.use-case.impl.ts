import { Injectable, Inject } from '@nestjs/common';
import { IRegisterUserUseCase } from './register-user.use-case.interface';
import { RegisterCommand, RegisterResult } from '../dtos/user-order.dto';
import { IUserRepository } from '../../domain/ports/user-repository.port';
import { IPasswordHasher } from '../../domain/ports/password-hasher.port';
import { IEventPublisher } from '../../domain/ports/event-publisher.port';
import { Email } from '../../domain/models/email.value-object';
import { Password } from '../../domain/models/password.value-object';
import { User } from '../../domain/models/user.aggregate';
import { Role } from '../../domain/models/role';
import { AuthenticationException } from '../../domain/exceptions/auth.exception';

@Injectable()
export class RegisterUserUseCaseImpl implements IRegisterUserUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
        @Inject('IPasswordHasher')
        private readonly passwordHasher: IPasswordHasher,
        @Inject('IEventPublisher')
        private readonly eventPublisher: IEventPublisher,
    ) {}

    async execute(command: RegisterCommand): Promise<RegisterResult> {
        if (!command) {
            throw new Error('Command must not be null');
        }

        const email = new Email(command.email);

        if (await this.userRepository.existsByEmail(email)) {
            throw new AuthenticationException('AUTH_EMAIL_EXISTS', 'An account with this email already exists');
        }

        const hashed = await this.passwordHasher.hash(command.password);
        const password = new Password(hashed);

        const roles = command.roles && command.roles.length > 0
            ? new Set(command.roles)
            : new Set([Role.USER]);

        const user = User.create(email, password, roles);
        const saved = await this.userRepository.save(user);

        await this.eventPublisher.publish({
            type: 'UserRegistered',
            payload: {
                userId: saved.id.getValue(),
                email: saved.email.getValue(),
            },
        });

        return {
            userId: saved.id.getValue(),
            email: saved.email.getValue(),
            roles: saved.roles,
        };
    }
}
