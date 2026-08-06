/**
 * S3 presigned-upload helper for feedback screenshots — server-only.
 *
 * The bucket stays private: the browser never gets AWS credentials, only a
 * short-lived signed PUT URL scoped to one UUID-named object.
 *
 * `ContentLength` IS part of the signed request (S3's presigner always keeps
 * it signed), so a client can't silently upload a bigger file than it
 * declared when requesting the URL — S3 rejects the PUT if the byte count
 * doesn't match. `ContentType`, by contrast, is unconditionally treated as
 * unsignable by `S3RequestPresigner` (see its `prepareRequest`) — no option
 * on `getSignedUrl` changes that, so it CANNOT be enforced by the signature.
 * The real content-type control is upstream of the URL: contentType and the
 * file name's extension are both checked against the allow-list before a URL
 * is ever issued, and the stored key's extension is derived from that
 * validated contentType rather than trusted from the client.
 */
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE_BYTES,
  isAllowedAttachmentExtension,
  isAllowedAttachmentMimeType,
  isPlausibleAttachmentKey,
  isValidAttachmentSize,
} from '@/lib/feedback/attachments';

export const PRESIGNED_UPLOAD_EXPIRY_SECONDS = 60;

export class PresignValidationError extends Error {}

let _client: S3Client | null = null;

function getS3Client(): S3Client {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'AWS is not configured: set AWS_REGION, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.'
    );
  }

  if (!_client) {
    _client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
  }
  return _client;
}

function getBucketName(): string {
  const bucket = process.env.AWS_BUCKET_NAME;
  if (!bucket) throw new Error('AWS is not configured: set AWS_BUCKET_NAME.');
  return bucket;
}

/** Env names the folder as AWS_S3_FOLDER; AWS_S3_FEEDBACK_FOLDER is accepted too. */
function getFeedbackFolder(): string {
  const folder = process.env.AWS_S3_FOLDER || process.env.AWS_S3_FEEDBACK_FOLDER || 'feedback-screenshot';
  return folder.replace(/^\/+|\/+$/g, '');
}

export interface PresignUploadInput {
  fileName: unknown;
  contentType: unknown;
  fileSize: unknown;
}

export interface PresignUploadResult {
  uploadUrl: string;
  key: string;
}

/**
 * Validates the request and returns a 60s presigned PUT URL + the object key
 * the caller must eventually report back to POST /api/feedback.
 *
 * The extension used in the KEY is derived from the (validated) content
 * type, never from the client-supplied file name — that name is only used
 * for a friendlier "does this look right" check, so a mismatched name can't
 * smuggle a different extension into the bucket.
 */
export async function createFeedbackUploadUrl({
  fileName,
  contentType,
  fileSize,
}: PresignUploadInput): Promise<PresignUploadResult> {
  if (typeof fileName !== 'string' || fileName.trim().length === 0) {
    throw new PresignValidationError('A file name is required.');
  }
  if (typeof contentType !== 'string' || !isAllowedAttachmentMimeType(contentType)) {
    throw new PresignValidationError('Only PNG, JPG, JPEG and WEBP are allowed.');
  }
  if (!isAllowedAttachmentExtension(fileName)) {
    throw new PresignValidationError('Only PNG, JPG, JPEG and WEBP are allowed.');
  }
  if (typeof fileSize !== 'number' || !isValidAttachmentSize(fileSize)) {
    throw new PresignValidationError('Maximum upload size is 2 MB.');
  }

  const bucket = getBucketName();
  const folder = getFeedbackFolder();
  const extension = ALLOWED_ATTACHMENT_MIME_TYPES[contentType];
  const key = `${folder}/${crypto.randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: fileSize,
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: PRESIGNED_UPLOAD_EXPIRY_SECONDS,
  });

  return { uploadUrl, key };
}

/**
 * Best-effort delete of feedback-screenshot objects — used to clean up
 * uploads that were never (or will never be) referenced by a `feedback` row:
 * the user removed the card after it finished uploading, closed/refreshed
 * the tab before submitting, or the Supabase insert failed after the upload
 * succeeded. Deliberately tolerant: only keys that look like ones WE would
 * have issued (right folder, UUID-ish name, allowed extension) are ever
 * deleted, everything else is silently dropped rather than erroring the
 * whole batch, and a missing object is not an error either.
 */
export async function deleteFeedbackAttachments(keys: unknown[]): Promise<string[]> {
  const folder = getFeedbackFolder();
  const validKeys = keys
    .filter((k): k is string => isPlausibleAttachmentKey(k) && k.startsWith(`${folder}/`))
    .slice(0, MAX_ATTACHMENTS);

  if (validKeys.length === 0) return [];

  await getS3Client().send(
    new DeleteObjectsCommand({
      Bucket: getBucketName(),
      Delete: { Objects: validKeys.map((Key) => ({ Key })), Quiet: true },
    })
  );

  return validKeys;
}

export function isAwsConfigured(): boolean {
  return Boolean(
    process.env.AWS_REGION &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_BUCKET_NAME
  );
}

export { MAX_ATTACHMENT_SIZE_BYTES };
