import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IPasswordHasher } from '../../domain/ports/password-hasher.port';

@Injectable()
export class BCryptPasswordHasher implements IPasswordHasher {
    private readonly saltRounds = 10;

    async hash(plaintext: string): Promise<string> {
        return bcrypt.hash(plaintext, this.saltRounds);
    }

    async matches(plaintext: string, hashed: string): Promise<boolean> {
        return bcrypt.compare(plaintext, hashed);
    }
}
