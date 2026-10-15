import { AppError } from './app-error.js'

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404, 'NOT_FOUND')
    }
}

export class BadRequestError extends AppError {
    constructor(message: string) {
        super(message, 400, 'BAD_REQUEST')
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string) {
        super(message, 401, 'UNAUTHORIZED')
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string) {
        super(message, 403, 'FORBIDDEN')
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, 'CONFLICT')
    }
}
