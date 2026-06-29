import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User as UserEntity } from './user.entity';
import { Email } from '../../domain/models/email.value-object';
import { Password } from '../../domain/models/password.value-object';
import { Role } from '../../domain/models/role';
import { UserId } from '../../domain/models/user-id.value-object';
import { User } from '../../domain/models/user.aggregate';
import { IUserRepository } from '../../domain/ports/user-repository.port';

@Injectable()
export class UserTypeOrmRepository implements IUserRepository {
    constructor(
        @InjectRepository(UserEntity)
        private readonly repo: Repository<UserEntity>,
    ) {}

    async save(user: User): Promise<User> {
        const entity = this.mapToEntity(user);
        await this.repo.save(entity);
        return user;
    }

    async findByEmail(email: Email): Promise<User | null> {
        const entity = await this.repo.findOne({ where: { email: email.getValue() } });
        return entity ? this.mapToDomain(entity) : null;
    }

    async findById(id: UserId): Promise<User | null> {
        const entity = await this.repo.findOne({ where: { id: id.getValue() } });
        return entity ? this.mapToDomain(entity) : null;
    }

    async existsByEmail(email: Email): Promise<boolean> {
        const count = await this.repo.count({ where: { email: email.getValue() } });
        return count > 0;
    }

    async deleteById(id: UserId): Promise<void> {
        await this.repo.delete(id.getValue());
    }

    async count(): Promise<number> {
        return this.repo.count();
    }

    private mapToEntity(user: User): UserEntity {
        return this.repo.create({
            id: user.id.getValue(),
            email: user.email.getValue(),
            passwordHash: user.password.getHashedValue(),
            roles: Array.from(user.roles),
            enabled: user.enabled,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
        });
    }

    private mapToDomain(entity: UserEntity): User {
        return new User(
            new UserId(entity.id),
            new Email(entity.email),
            new Password(entity.passwordHash),
            new Set(entity.roles),
            entity.enabled,
            entity.createdAt,
            entity.lastLoginAt,
        );
    }
}
