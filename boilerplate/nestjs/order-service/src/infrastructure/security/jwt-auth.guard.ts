import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from "@nestjs/common";

import { ITokenParser } from "../../domain/ports/token-parser.port";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject("ITokenParser")
    private readonly tokenParser: ITokenParser,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return false;
    }

    const token = authHeader.split(" ")[1];
    const userId = this.tokenParser.parseUserId(token);

    if (!userId) {
      return false;
    }

    request.user = { id: userId.getValue() };
    return true;
  }
}
