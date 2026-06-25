import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { IUserRepository } from '../../domain/ports/user-repository.port';
import { IPasswordHasher } from '../../domain/ports/password-hasher.port';
import { Email } from '../../domain/models/email.value-object';
import { Password } from '../../domain/models/password.value-object';
import { User } from '../../domain/models/user.aggregate';
import { Role } from '../../domain/models/role';

@Injectable()
export class SeedDataService implements OnModuleInit {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
        @Inject('IPasswordHasher')
        private readonly passwordHasher: IPasswordHasher,
    ) {}

    async onModuleInit(): Promise<void> {
        const demoEmail = new Email('demo@example.com');
        const existing = await this.userRepository.findByEmail(demoEmail);
        if (existing) {
            return; // Already seeded
        }

        const hashed = await this.passwordHasher.hash('DemoPass1!');
        const password = new Password(hashed);
        const roles = new Set([Role.USER]);
        const user = User.create(demoEmail, password, roles);
        await this.userRepository.save(user);
    }
}
