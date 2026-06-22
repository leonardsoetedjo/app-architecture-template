import { LoginCommand, LoginResult } from '../dtos/auth.dto';

export interface IAuthenticateUserUseCase {
    execute(command: LoginCommand): Promise<LoginResult>;
}
