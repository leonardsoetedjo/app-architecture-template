export class Email {
  private static readonly EMAIL_PATTERN =
    /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

  constructor(private readonly value: string) {
    if (!value || value.trim() === "") {
      throw new Error("Email cannot be null or blank");
    }
    if (!Email.EMAIL_PATTERN.test(value)) {
      throw new Error(`Invalid email format: ${value}`);
    }
  }

  getValue(): string {
    return this.value.toLowerCase().trim();
  }

  equals(other: Email): boolean {
    return other instanceof Email && this.getValue() === other.getValue();
  }

  toString(): string {
    return this.getValue();
  }
}
