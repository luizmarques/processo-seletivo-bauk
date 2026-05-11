export class DomainError extends Error {}

export class ValidationDomainError extends DomainError {}

export class AuthenticationError extends DomainError {}

export class ResourceConflictError extends DomainError {}

export class ResourceNotFoundError extends DomainError {}
