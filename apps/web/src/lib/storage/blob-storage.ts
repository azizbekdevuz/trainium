import { mkdir, writeFile, readFile, unlink, stat } from 'fs/promises';
import { join } from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getUploadsRoot } from '@/lib/storage/upload-paths';
import { sanitizeFilename } from '@/lib/utils/path-safety';
import { storageLog } from '@/lib/storage/storage-log';
import { StorageBackendError, isEnoent, isS3NotFound } from '@/lib/storage/storage-errors';

export type PublicFileStorageBackend = 'local' | 's3';

export function getPublicFileStorageBackend(): PublicFileStorageBackend {
  const v = process.env.PUBLIC_FILE_STORAGE?.trim().toLowerCase();
  return v === 's3' ? 's3' : 'local';
}

function assertFlatKey(key: string): string {
  const safe = sanitizeFilename(key);
  if (!safe || safe !== key) {
    throw new Error('Invalid storage key');
  }
  return safe;
}

export function contentTypeForFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'avif':
      return 'image/avif';
    default:
      return 'application/octet-stream';
  }
}

export interface PublicBlobStorage {
  put(key: string, body: Buffer, contentType?: string): Promise<void>;
  /**
   * Returns null only when the object is definitively missing.
   * Throws StorageBackendError for permission, I/O, or S3 errors (caller should not return 404).
   */
  getBytes(key: string): Promise<Buffer | null>;
  /** Best-effort: on backend errors returns false so callers can fall back (e.g. try another variant). */
  exists(key: string): Promise<boolean>;
  /** Idempotent: missing object is not an error; other failures are logged at warn. */
  delete(key: string): Promise<void>;
}

class LocalBlobStorage implements PublicBlobStorage {
  constructor(private readonly root: string) {}

  async put(key: string, body: Buffer): Promise<void> {
    const safe = assertFlatKey(key);
    const dir = this.root;
    try {
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, safe), body);
    } catch (e) {
      storageLog('error', 'local_put_failed', {
        key: safe,
        message: e instanceof Error ? e.message : 'unknown',
      });
      throw new StorageBackendError('Local put failed', e);
    }
  }

  async getBytes(key: string): Promise<Buffer | null> {
    const safe = assertFlatKey(key);
    const full = join(this.root, safe);
    try {
      return await readFile(full);
    } catch (e) {
      if (isEnoent(e)) return null;
      storageLog('error', 'local_get_failed', {
        key: safe,
        message: e instanceof Error ? e.message : 'unknown',
      });
      throw new StorageBackendError('Local read failed', e);
    }
  }

  async exists(key: string): Promise<boolean> {
    const safe = assertFlatKey(key);
    const full = join(this.root, safe);
    try {
      await stat(full);
      return true;
    } catch (e) {
      if (isEnoent(e)) return false;
      storageLog('warn', 'local_exists_failed', {
        key: safe,
        message: e instanceof Error ? e.message : 'unknown',
      });
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    const safe = assertFlatKey(key);
    const full = join(this.root, safe);
    try {
      await unlink(full);
    } catch (e) {
      if (isEnoent(e)) return;
      storageLog('warn', 'local_delete_failed', {
        key: safe,
        message: e instanceof Error ? e.message : 'unknown',
      });
    }
  }
}

function s3ObjectKey(prefix: string | undefined, key: string): string {
  const safe = assertFlatKey(key);
  if (!prefix) return safe;
  const p = prefix.endsWith('/') ? prefix : `${prefix}/`;
  return `${p}${safe}`;
}

class S3BlobStorage implements PublicBlobStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly prefix: string | undefined;

  constructor(client: S3Client, bucket: string, prefix: string | undefined) {
    this.client = client;
    this.bucket = bucket;
    this.prefix = prefix;
  }

  async put(key: string, body: Buffer, contentType?: string): Promise<void> {
    const objectKey = s3ObjectKey(this.prefix, key);
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
          Body: body,
          ContentType: contentType ?? contentTypeForFilename(key),
        })
      );
    } catch (e) {
      storageLog('error', 's3_put_failed', {
        key: objectKey,
        message: e instanceof Error ? e.message : 'unknown',
      });
      throw new StorageBackendError('S3 put failed', e);
    }
  }

  async getBytes(key: string): Promise<Buffer | null> {
    const objectKey = s3ObjectKey(this.prefix, key);
    try {
      const out = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: objectKey })
      );
      if (!out.Body) return null;
      const chunks: Uint8Array[] = [];
      for await (const chunk of out.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (e) {
      if (isS3NotFound(e)) return null;
      storageLog('error', 's3_get_failed', {
        key: objectKey,
        message: e instanceof Error ? e.message : 'unknown',
      });
      throw new StorageBackendError('S3 get failed', e);
    }
  }

  async exists(key: string): Promise<boolean> {
    const objectKey = s3ObjectKey(this.prefix, key);
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey })
      );
      return true;
    } catch (e) {
      if (isS3NotFound(e)) return false;
      storageLog('warn', 's3_head_failed', {
        key: objectKey,
        message: e instanceof Error ? e.message : 'unknown',
      });
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    const objectKey = s3ObjectKey(this.prefix, key);
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey })
      );
    } catch (e) {
      if (isS3NotFound(e)) return;
      storageLog('warn', 's3_delete_failed', {
        key: objectKey,
        message: e instanceof Error ? e.message : 'unknown',
      });
    }
  }
}

function endpointHostname(endpoint: string | undefined): string {
  if (!endpoint) return '';
  try {
    return new URL(endpoint).hostname;
  } catch {
    return '(unparsed)';
  }
}

function createS3BlobStorage(): S3BlobStorage {
  const bucket = process.env.S3_BUCKET?.trim();
  if (!bucket) {
    throw new Error('PUBLIC_FILE_STORAGE=s3 requires S3_BUCKET');
  }
  const region = process.env.S3_REGION?.trim() || process.env.AWS_REGION?.trim() || 'us-east-1';
  const endpoint = process.env.S3_ENDPOINT?.trim() || undefined;
  const accessKeyId =
    process.env.S3_ACCESS_KEY_ID?.trim() || process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY?.trim() || process.env.AWS_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'PUBLIC_FILE_STORAGE=s3 requires S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY (or AWS_* equivalents)'
    );
  }
  const forcePathStyle =
    process.env.S3_FORCE_PATH_STYLE === 'true' ||
    process.env.S3_FORCE_PATH_STYLE === '1' ||
    !!endpoint;

  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: { accessKeyId, secretAccessKey },
  });
  const prefix = process.env.S3_KEY_PREFIX?.trim() || undefined;
  return new S3BlobStorage(client, bucket, prefix);
}

let cached: PublicBlobStorage | null = null;
let cachedBackend: PublicFileStorageBackend | null = null;

function logInit(backend: PublicFileStorageBackend): void {
  if (backend === 'local') {
    const uploadsDir = getUploadsRoot();
    storageLog('info', 'init', { backend: 'local', uploadsDir });
    return;
  }
  const bucket = process.env.S3_BUCKET?.trim() ?? '';
  const region =
    process.env.S3_REGION?.trim() || process.env.AWS_REGION?.trim() || 'us-east-1';
  const prefix = process.env.S3_KEY_PREFIX?.trim() || '';
  const endpoint = process.env.S3_ENDPOINT?.trim();
  storageLog('info', 'init', {
    backend: 's3',
    bucket,
    region,
    keyPrefix: prefix || '(none)',
    endpointHost: endpointHostname(endpoint),
  });
}

/** Server-only singleton for user/product upload bytes. */
export function getPublicBlobStorage(): PublicBlobStorage {
  const backend = getPublicFileStorageBackend();
  if (cached && cachedBackend === backend) return cached;

  if (backend === 's3') {
    cached = createS3BlobStorage();
  } else {
    cached = new LocalBlobStorage(getUploadsRoot());
  }
  cachedBackend = backend;
  logInit(backend);
  return cached;
}

export { StorageBackendError, isStorageBackendError } from '@/lib/storage/storage-errors';
