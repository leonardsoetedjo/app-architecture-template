export class Password {
  constructor(private readonly hashedValue: string) {}
  getHashedValue(): string {
    return this.hashedValue;
  }
  equals(other: Password): boolean {
    return other instanceof Password && this.hashedValue === other.hashedValue;
  }

  static validatePlaintext(plaintext: string): void {
    if (!plaintext || plaintext.trim() === "")
      throw new Error("AUTH_PASSWORD_EMPTY");
    if (plaintext.length < 8) throw new Error("AUTH_PASSWORD_TOO_SHORT");
    if (plaintext.length > 128) throw new Error("AUTH_PASSWORD_TOO_LONG");
    if (!/[A-Z]/.test(plaintext)) throw new Error("AUTH_PASSWORD_NO_UPPER");
    if (!/[a-z]/.test(plaintext)) throw new Error("AUTH_PASSWORD_NO_LOWER");
    if (!/[0-9]/.test(plaintext)) throw new Error("AUTH_PASSWORD_NO_DIGIT");
    if (!/[!@#$%^&*()\-=_+{};:'",.<>/?]/.test(plaintext))
      throw new Error("AUTH_PASSWORD_NO_SPECIAL");
  }
}
