import { Email } from '../models/email.value-object';
import { UserId } from '../models/user-id.value-object';
import { User } from '../models/user.aggregate';

export interface IUserRepository {
    save(user: User): Promise<User>;
    findById(id: UserId): Promise<User | null>;
    findByEmail(email: Email): Promise<User | null>;
    existsByEmail(email: Email): Promise<boolean>;
    deleteById(id: UserId): Promise<void>;
    count(): Promise<number>;
}
