export class UserId {
    constructor(private readonly value: string) {}
    getValue(): string { return this.value; }
    equals(other: UserId): boolean { return other instanceof UserId && this.value === other.value; }
    toString(): string { return this.value; }
    static generate(): UserId { return new UserId(require('crypto').randomUUID()); }
}
