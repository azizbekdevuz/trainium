/**
 * Thrown when a read/write/delete fails for reasons other than "object does not exist".
 * Callers should log and return 5xx; do not treat as a client 404.
 */
export class StorageBackendError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'StorageBackendError';
    this.cause = cause;
  }
}

export function isStorageBackendError(e: unknown): e is StorageBackendError {
  return e instanceof StorageBackendError;
}

function isNodeErr(e: unknown): e is NodeJS.ErrnoException {
  return typeof e === 'object' && e !== null && 'code' in e;
}

export function isEnoent(e: unknown): boolean {
  return isNodeErr(e) && e.code === 'ENOENT';
}

/** S3 / AWS SDK: missing object */
export function isS3NotFound(e: unknown): boolean {
  const err = e as {
    name?: string;
    Code?: string;
    $metadata?: { httpStatusCode?: number };
  };
  if (err.name === 'NotFound' || err.name === 'NoSuchKey') return true;
  if (err.Code === 'NoSuchKey') return true;
  return err.$metadata?.httpStatusCode === 404;
}
