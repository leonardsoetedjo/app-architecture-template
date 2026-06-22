export class DomainException extends Error {
    constructor(public readonly code: string, message: string) {
        super(message);
        this.name = 'DomainException';
    }
}

export class AuthenticationException extends DomainException {
    constructor(code: string = 'AUTH_ERROR', message: string) {
        super(code, message);
        this.name = 'AuthenticationException';
    }
}
