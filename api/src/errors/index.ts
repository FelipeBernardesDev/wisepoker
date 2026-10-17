import { AppError } from './app-error.js'

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(404, 'NOT_FOUND', message)
    }
}

export class BadRequestError extends AppError {
    constructor(message: string) {
        super(400, 'BAD_REQUEST', message)
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string) {
        super(401, 'UNAUTHORIZED', message)
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string) {
        super(403, 'FORBIDDEN', message)
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(409, 'CONFLICT', message)
    }
}

export class InsufficientFundsError extends AppError {
    constructor(message: string) {
        super(400, 'INSUFFICIENT_FUNDS', message)
    }
}
