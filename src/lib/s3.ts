import {
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  absoluteUrl,
  getBooleanEnv,
  getEnv,
  getOptionalEnv
} from "@/lib/env";

function getStorageDriver() {
  return process.env.STORAGE_DRIVER ?? "local";
}

function getBucket() {
  return getEnv("S3_BUCKET", "music-growth-os");
}

function getS3Client() {
  return new S3Client({
    endpoint: getOptionalEnv("S3_ENDPOINT"),
    region: getEnv("S3_REGION", "auto"),
    forcePathStyle: getBooleanEnv(
      "S3_FORCE_PATH_STYLE",
      true
    ),
    credentials: {
      accessKeyId: getEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: getEnv(
        "S3_SECRET_ACCESS_KEY"
      )
    }
  });
}

export function createObjectKey(
  prefix: string,
  filename: string
) {
  const safeName = filename
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-");

  return `${prefix}/${new Date()
    .toISOString()
    .slice(0, 10)}/${nanoid(
    12
  )}-${safeName}`;
}

export function objectPublicUrl(
  key: string
) {
  if (getStorageDriver() !== "s3") {
    return absoluteUrl(`/uploads/${key}`);
  }

  const publicBaseUrl =
    getOptionalEnv("S3_PUBLIC_BASE_URL");

  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(
      /\/$/,
      ""
    )}/${key}`;
  }

  const bucket = getBucket();

  return `https://${bucket}.r2.dev/${key}`;
}

export async function uploadBuffer(
  input: {
    key: string;
    body: Buffer;
    contentType: string;
    metadata?: Record<string, string>;
  }
) {
  if (getStorageDriver() !== "s3") {
    const outputPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      input.key
    );
    await mkdir(path.dirname(outputPath), {
      recursive: true
    });
    await writeFile(outputPath, input.body);

    return objectPublicUrl(input.key);
  }

  const s3Client = getS3Client();

  await s3Client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      Metadata: input.metadata
    })
  );

  return objectPublicUrl(input.key);
}

export async function createUploadUrl(
  input: {
    key: string;
    contentType: string;
  }
) {
  if (getStorageDriver() !== "s3") {
    return objectPublicUrl(input.key);
  }

  const s3Client = getS3Client();

  return getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: input.key,
      ContentType: input.contentType
    }),
    {
      expiresIn: 300
    }
  );
}
