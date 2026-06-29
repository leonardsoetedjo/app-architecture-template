import { Entity, PrimaryColumn, Column } from "typeorm";

import { Role } from "../../domain/models/role";

@Entity("users")
export class User {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: "password_hash" })
  passwordHash: string;

  @Column("simple-array")
  roles: Role[];

  @Column({ default: true })
  enabled: boolean;

  @Column({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "last_login_at", nullable: true })
  lastLoginAt: Date;
}
