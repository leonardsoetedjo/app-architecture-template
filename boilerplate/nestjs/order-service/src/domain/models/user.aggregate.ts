import { Email } from "./email.value-object";
import { Password } from "./password.value-object";
import { Role } from "./role";
import { UserId } from "./user-id.value-object";
import { AuthenticationException } from "../exceptions/auth.exception";
import { IPasswordHasher } from "../ports/password-hasher.port";

export class User {
  constructor(
    public readonly id: UserId,
    public readonly email: Email,
    public password: Password,
    public readonly roles: Set<Role>,
    public enabled: boolean,
    public readonly createdAt: Date,
    public lastLoginAt?: Date,
  ) {}

  static create(email: Email, password: Password, roles: Set<Role>): User {
    return new User(
      UserId.generate(),
      email,
      password,
      roles,
      true,
      new Date(),
    );
  }

  static createWithDefaults(email: Email, password: Password): User {
    return this.create(email, password, new Set([Role.USER]));
  }

  async authenticate(
    plaintextPassword: string,
    passwordHasher: IPasswordHasher,
  ): Promise<boolean> {
    if (!this.enabled) {
      throw new AuthenticationException(
        "AUTH_USER_DISABLED",
        "User account is disabled",
      );
    }
    return passwordHasher.matches(
      plaintextPassword,
      this.password.getHashedValue(),
    );
  }

  recordLogin(): void {
    this.lastLoginAt = new Date();
  }

  changePassword(newPassword: Password): void {
    this.password = newPassword;
  }

  disable(): void {
    this.enabled = false;
  }
  enable(): void {
    this.enabled = true;
  }

  hasRole(role: Role): boolean {
    return this.roles.has(role);
  }
  hasAnyRole(...requiredRoles: Role[]): boolean {
    return requiredRoles.some((role) => this.roles.has(role));
  }
}
