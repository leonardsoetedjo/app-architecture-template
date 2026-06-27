import { RefreshTokenCommand, RefreshTokenResult } from '../dtos/refresh-token.dto';

export interface IRefreshTokenUseCase {
    execute(command: RefreshTokenCommand): Promise<RefreshTokenResult>;
}
