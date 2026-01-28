export class AroError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'AroError';
    Object.setPrototypeOf(this, AroError.prototype);
  }
}

export class PathTraversalError extends AroError {
  constructor(relPath: string) {
    super(`Path traversal not allowed: ${relPath}`, 'PATH_TRAVERSAL');
    this.name = 'PathTraversalError';
    Object.setPrototypeOf(this, PathTraversalError.prototype);
  }
}
