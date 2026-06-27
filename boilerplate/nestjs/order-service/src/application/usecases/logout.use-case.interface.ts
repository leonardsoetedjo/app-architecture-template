import { UserId } from '../../domain/models/user-id.value-object';

export interface ILogoutUseCase {
    execute(userId: UserId): Promise<void>;
}
