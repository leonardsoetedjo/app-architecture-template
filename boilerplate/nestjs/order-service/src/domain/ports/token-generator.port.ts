import { User } from '../models/user.aggregate';

export interface ITokenGenerator {
    generateAccessToken(user: User): string;
    generateRefreshToken(user: User): string;
}
