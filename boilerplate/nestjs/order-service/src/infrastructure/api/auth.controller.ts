import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  Headers,
  UnauthorizedException,
  Res,
} from "@nestjs/common";
import { Response } from "express";

import { LoginCommand, LoginResult } from "../../application/dtos/auth.dto";
import {
  RefreshTokenCommand,
  RefreshTokenResult,
} from "../../application/dtos/refresh-token.dto";
import {
  RegisterCommand,
  RegisterResult,
} from "../../application/dtos/user-order.dto";
import { UserProfileResult } from "../../application/dtos/user-order.dto";
import { IAuthenticateUserUseCase } from "../../application/usecases/authenticate-user.use-case.interface";
import { IGetCurrentUserUseCase } from "../../application/usecases/get-current-user.use-case.interface";
import { ILogoutUseCase } from "../../application/usecases/logout.use-case.interface";
import { IRefreshTokenUseCase } from "../../application/usecases/refresh-token.use-case.interface";
import { IRegisterUserUseCase } from "../../application/usecases/register-user.use-case.interface";
import { ITokenParser } from "../../domain/ports/token-parser.port";

@Controller("api/v1/auth")
export class AuthController {
  constructor(
    @Inject("IAuthenticateUserUseCase")
    private readonly authenticateUserUseCase: IAuthenticateUserUseCase,
    @Inject("IRegisterUserUseCase")
    private readonly registerUserUseCase: IRegisterUserUseCase,
    @Inject("IGetCurrentUserUseCase")
    private readonly getCurrentUserUseCase: IGetCurrentUserUseCase,
    @Inject("IRefreshTokenUseCase")
    private readonly refreshTokenUseCase: IRefreshTokenUseCase,
    @Inject("ILogoutUseCase")
    private readonly logoutUseCase: ILogoutUseCase,
    @Inject("ITokenParser")
    private readonly tokenParser: ITokenParser,
  ) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() command: RegisterCommand): Promise<RegisterResult> {
    return this.registerUserUseCase.execute(command);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() command: LoginCommand,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResult> {
    const result = await this.authenticateUserUseCase.execute(command);
    // Set httpOnly cookies for token storage (XSS prevention)
    response.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600 * 1000, // 1 hour
    });
    response.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 3600 * 1000, // 24 hours
    });
    return result;
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() command: RefreshTokenCommand,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RefreshTokenResult> {
    const result = await this.refreshTokenUseCase.execute(command);
    // Rotate cookies with new token pair
    response.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600 * 1000,
    });
    response.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 3600 * 1000,
    });
    return result;
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Headers("authorization") authHeader: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const userId = this.tokenParser.parseUserId(token);
      if (userId) {
        await this.logoutUseCase.execute(userId);
      }
    }
    response.clearCookie("access_token");
    response.clearCookie("refresh_token");
  }

  @Get("me")
  @HttpCode(HttpStatus.OK)
  async me(
    @Headers("authorization") authHeader: string,
  ): Promise<UserProfileResult> {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Authentication required");
    }
    const token = authHeader.split(" ")[1];
    const userId = this.tokenParser.parseUserId(token);
    if (!userId) {
      throw new UnauthorizedException("Invalid token");
    }
    return this.getCurrentUserUseCase.execute(userId);
  }
}
