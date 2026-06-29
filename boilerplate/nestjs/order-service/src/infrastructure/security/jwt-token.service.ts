import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { UserId } from "../../domain/models/user-id.value-object";
import { User } from "../../domain/models/user.aggregate";
import { ITokenGenerator } from "../../domain/ports/token-generator.port";
import { ITokenParser } from "../../domain/ports/token-parser.port";

@Injectable()
export class JwtTokenService implements ITokenGenerator, ITokenParser {
  constructor(private readonly jwtService: JwtService) {}

  generateAccessToken(user: User): string {
    const payload = {
      sub: user.id.getValue(),
      email: user.email.getValue(),
      roles: Array.from(user.roles),
    };
    return this.jwtService.sign(payload, { expiresIn: "15m" });
  }

  generateRefreshToken(user: User): string {
    const payload = { sub: user.id.getValue() };
    return this.jwtService.sign(payload, { expiresIn: "7d" });
  }

  parseUserId(token: string): UserId | null {
    try {
      const decoded = this.jwtService.verify(token) as any;
      return decoded ? new UserId(decoded.sub) : null;
    } catch {
      return null;
    }
  }

  isValid(token: string): boolean {
    try {
      this.jwtService.verify(token);
      return true;
    } catch {
      return false;
    }
  }
}
