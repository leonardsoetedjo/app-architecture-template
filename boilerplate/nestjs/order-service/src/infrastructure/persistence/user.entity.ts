import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';
import { Role } from '../../domain/models/role';

@Entity('users')
export class User {
    @PrimaryColumn()
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column('simple-array')
    roles: Role[];

    @Column({ default: true })
    enabled: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    lastLoginAt: Date;
}
