import { UserId } from '../../domain/models/user-id.value-object';
import { UserProfileResult } from '../dtos/user-order.dto';

export interface IGetCurrentUserUseCase {
    execute(userId: UserId): Promise<UserProfileResult>;
}
