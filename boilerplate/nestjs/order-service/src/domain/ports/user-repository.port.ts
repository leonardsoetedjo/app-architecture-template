import { User } from '../models/user.aggregate';
import { UserId } from '../models/user-id.value-object';
import { Email } from '../models/email.value-object';

export interface IUserRepository {
    save(user: User): Promise<User>;
    findById(id: UserId): Promise<User | null>;
    findByEmail(email: Email): Promise<User | null>;
    existsByEmail(email: Email): Promise<boolean>;
    deleteById(id: UserId): Promise<void>;
    count(): Promise<number>;
}
