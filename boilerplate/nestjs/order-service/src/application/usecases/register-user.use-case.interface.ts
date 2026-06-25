import { RegisterCommand, RegisterResult } from '../dtos/user-order.dto';

export interface IRegisterUserUseCase {
    execute(command: RegisterCommand): Promise<RegisterResult>;
}
