import { Injectable } from "@nestjs/common";

import { ILogoutUseCase } from "./logout.use-case.interface";
import { UserId } from "../../domain/models/user-id.value-object";

@Injectable()
export class LogoutUseCaseImpl implements ILogoutUseCase {
  async execute(userId: UserId): Promise<void> {
    // TODO: Add token to Redis blacklist with TTL matching token expiry
    // For now, tokens expire naturally via JWT expiration
    console.log(
      `User ${userId.getValue()} logged out — token blacklist not yet implemented`,
    );
  }
}
