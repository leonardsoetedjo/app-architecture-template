import { Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext, Injectable as NestInjectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenParser } from '../../domain/ports/token-parser.port';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly tokenParser: ITokenParser) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return false;
        }

        const token = authHeader.split(' ')[1];
        const userId = this.tokenParser.parseUserId(token);

        if (!userId) {
            return false;
        }

        request.user = { id: userId.getValue() };
        return true;
    }
}
