export interface IPasswordHasher {
  hash(plaintext: string): Promise<string>;
  matches(plaintext: string, hashed: string): Promise<boolean>;
}
