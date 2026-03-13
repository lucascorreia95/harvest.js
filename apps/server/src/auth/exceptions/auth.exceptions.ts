export class AuthException extends Error {
  constructor(
    public message: string,
    public statusCode: number = 401,
  ) {
    super(message);
    this.name = 'AuthException';
  }
}

export class InvalidCredentialsException extends AuthException {
  constructor() {
    super('Login or password do not match', 401);
    this.name = 'InvalidCredentialsException';
  }
}

export class UserNotFoundException extends AuthException {
  constructor() {
    super('User not found', 404);
    this.name = 'UserNotFoundException';
  }
}

export class UserAlreadyExistsException extends AuthException {
  constructor() {
    super('Username already taken', 409);
    this.name = 'UserAlreadyExistsException';
  }
}
