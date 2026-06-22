import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthenticateUserUseCaseImpl } from '../../application/usecases/authenticate-user.use-case.impl';
import { AuthController } from '../api/auth.controller';
import { BCryptPasswordHasher } from './bcrypt-password-hasher';
import { JwtTokenService } from './jwt-token.service';
import { UserTypeOrmRepository } from '../persistence/user.typeorm-repository';
import { EventEmitterPublisherAdapter } from '../events/event-emitter-publisher.adapter';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secret: 'super-secret-key',
            signOptions: { expiresIn: '15m' },
        }),
    ],
    controllers: [AuthController],
    providers: [
        {
            provide: 'IAuthenticateUserUseCase',
            useClass: AuthenticateUserUseCaseImpl,
        },
        {
            provide: 'IPasswordHasher',
            useClass: BCryptPasswordHasher,
        },
        {
            provide: 'ITokenGenerator',
            useClass: JwtTokenService,
        },
        {
            provide: 'ITokenParser',
            useClass: JwtTokenService,
        },
        {
            provide: 'IUserRepository',
            useClass: UserTypeOrmRepository,
        },
        {
            provide: 'IEventPublisher',
            useClass: EventEmitterPublisherAdapter,
        },
    ],
    exports: ['IAuthenticateUserUseCase'],
})
export class AuthModule {}
