import { UserProfileResult } from '../dtos/user-order.dto';
import { UserId } from '../../domain/models/user-id.value-object';

export interface IGetCurrentUserUseCase {
    execute(userId: UserId): Promise<UserProfileResult>;
}
