import { UserId } from '../models/user-id.value-object';

export interface ITokenParser {
    parseUserId(token: string): UserId | null;
    isValid(token: string): boolean;
}
