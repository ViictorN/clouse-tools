import * as path from 'node:path';
import { AppError } from '@clouse/core';
import { sha256Hex } from './crypto-auth';
import { sanitizeFilename } from './validation';

const EICAR_SIGNATURE = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

export const ALLOWED_UPLOAD_TYPES: Record<
  string,
  { extensions: string[]; mimes: string[] }
> = {
  'application/pdf': { extensions: ['pdf'], mimes: ['application/pdf'] },
  'image/png': { extensions: ['png'], mimes: ['image/png'] },
  'image/jpeg': { extensions: ['jpg', 'jpeg'], mimes: ['image/jpeg'] },
  'image/gif': { extensions: ['gif'], mimes: ['image/gif'] },
  'image/webp': { extensions: ['webp'], mimes: ['image/webp'] },
  'image/svg+xml': { extensions: ['svg'], mimes: ['image/svg+xml'] },
  'application/zip': { extensions: ['zip'], mimes: ['application/zip', 'application/x-zip-compressed'] },
  'audio/mpeg': { extensions: ['mp3'], mimes: ['audio/mpeg'] },
  'audio/wav': { extensions: ['wav'], mimes: ['audio/wav', 'audio/x-wav'] },
  'video/mp4': { extensions: ['mp4'], mimes: ['video/mp4'] },
  'text/plain': { extensions: ['txt'], mimes: ['text/plain'] },
  'text/markdown': { extensions: ['md', 'markdown'], mimes: ['text/markdown', 'text/plain'] },
};

export function detectMagicMimeType(bytes: Uint8Array): string | null {
  if (bytes.byteLength < 4) {
    return null;
  }

  // Block Windows PE (MZ) and Linux ELF binaries immediately
  if ((bytes[0] === 0x4d && bytes[1] === 0x5a) || (bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46)) {
    throw AppError.unsupportedMedia('EXECUTABLE_BINARY_BLOCKED', 'Executable binaries (PE/ELF) are strictly forbidden.');
  }

  // PDF: %PDF-
  if (
    bytes.byteLength >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return 'application/pdf';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.byteLength >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  // GIF: GIF87a or GIF89a
  if (
    bytes.byteLength >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return 'image/gif';
  }

  // RIFF container: WebP or WAV
  if (
    bytes.byteLength >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    const tag = Buffer.from(bytes.subarray(8, 12)).toString('ascii');
    if (tag === 'WEBP') return 'image/webp';
    if (tag === 'WAVE') return 'audio/wav';
  }

  // ZIP: PK\x03\x04 or PK\x05\x06
  if (
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    ((bytes[2] === 0x03 && bytes[3] === 0x04) || (bytes[2] === 0x05 && bytes[3] === 0x06))
  ) {
    return 'application/zip';
  }

  // MP4: ....ftyp at offset 4..8
  if (bytes.byteLength >= 12) {
    const boxType = Buffer.from(bytes.subarray(4, 8)).toString('ascii');
    if (boxType === 'ftyp') {
      return 'video/mp4';
    }
  }

  // MP3: ID3 or MPEG sync word FF FB / FF F3 / FF F2
  if (
    (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
    (bytes[0] === 0xff && (bytes[1] === 0xfb || bytes[1] === 0xf3 || bytes[1] === 0xf2))
  ) {
    return 'audio/mpeg';
  }

  // Check UTF-8 text / SVG (ensure no null bytes in first 4KB)
  const headSlice = bytes.subarray(0, Math.min(bytes.byteLength, 4096));
  for (let i = 0; i < headSlice.byteLength; i++) {
    if (headSlice[i] === 0x00) {
      return null;
    }
  }
  const headText = Buffer.from(headSlice).toString('utf8').trimStart();
  if (/^(<\?xml[\s\S]*?)?<svg[\s>]/i.test(headText)) {
    return 'image/svg+xml';
  }
  return 'text/plain';
}

export interface VerifiedUploadFile {
  safeFilename: string;
  extension: string;
  verifiedMime: string;
  sizeBytes: number;
  sha256Hex: string;
}

export function verifyUploadedFile(options: {
  filename: string;
  declaredMime: string;
  bytes: Uint8Array;
  maxBytes?: number;
  allowedMimes?: string[];
}): VerifiedUploadFile {
  const maxBytes = options.maxBytes ?? 26_214_400; // 25 MiB
  if (options.bytes.byteLength === 0) {
    throw AppError.badRequest('EMPTY_FILE', 'Uploaded file is empty.');
  }
  if (options.bytes.byteLength > maxBytes) {
    throw AppError.payloadTooLarge(
      'FILE_SIZE_LIMIT_EXCEEDED',
      `File size (${options.bytes.byteLength} bytes) exceeds maximum allowed (${maxBytes} bytes).`
    );
  }

  // Malware / EICAR signature scan
  const sampleAscii = Buffer.from(options.bytes.subarray(0, Math.min(options.bytes.byteLength, 8192))).toString('utf8');
  if (sampleAscii.includes(EICAR_SIGNATURE)) {
    throw AppError.forbidden('MALWARE_SIGNATURE_DETECTED', 'Upload blocked by anti-malware signature scanner.');
  }

  const safeFilename = sanitizeFilename(options.filename);
  const ext = path.posix.extname(safeFilename).replace(/^\./, '').toLowerCase();
  if (!ext) {
    throw AppError.unsupportedMedia('EXTENSION_REQUIRED', 'Uploaded file must have an explicit allowed extension.');
  }

  let detectedMime = detectMagicMimeType(options.bytes);
  if (detectedMime === 'text/plain' && (ext === 'md' || ext === 'markdown')) {
    detectedMime = 'text/markdown';
  }

  if (!detectedMime || !(detectedMime in ALLOWED_UPLOAD_TYPES)) {
    throw AppError.unsupportedMedia(
      'MAGIC_MIME_REJECTED',
      'File binary signature does not match any permitted media format.'
    );
  }

  const rule = ALLOWED_UPLOAD_TYPES[detectedMime];
  if (!rule.extensions.includes(ext)) {
    throw AppError.unsupportedMedia(
      'EXTENSION_MIME_MISMATCH',
      `File extension ".${ext}" does not match binary signature "${detectedMime}".`
    );
  }

  const normalizedDeclared = options.declaredMime.split(';')[0].trim().toLowerCase();
  if (normalizedDeclared && normalizedDeclared !== 'application/octet-stream' && !rule.mimes.includes(normalizedDeclared)) {
    throw AppError.unsupportedMedia(
      'DECLARED_MIME_MISMATCH',
      `Declared Content-Type "${normalizedDeclared}" conflicts with verified binary signature "${detectedMime}".`
    );
  }

  if (options.allowedMimes && options.allowedMimes.length > 0 && !options.allowedMimes.includes(detectedMime)) {
    throw AppError.unsupportedMedia(
      'TOOL_MIME_NOT_ALLOWED',
      `Verified MIME "${detectedMime}" is not permitted for this tool.`
    );
  }

  return {
    safeFilename,
    extension: ext,
    verifiedMime: detectedMime,
    sizeBytes: options.bytes.byteLength,
    sha256Hex: sha256Hex(options.bytes),
  };
}

// =============================================================================
// PDF Static Threat Inspector & Metadata Scrubber (Domain 12 / Security 13)
// =============================================================================
export interface PdfAuditReport {
  pdfVersion: string;
  pageCount: number;
  hasEncryption: boolean;
  hasEmbeddedScripts: boolean;
  hasDangerousActions: boolean;
  hasEmbeddedFiles: boolean;
  externalLinks: string[];
  metadataFieldsScrubbed: string[];
  safe: boolean;
  scrubbedPdfBase64: string;
}

export function inspectAndScrubPdf(
  bytes: Uint8Array,
  options: { maxPages?: number; rejectExternalLinks?: boolean } = {}
): PdfAuditReport {
  const maxPages = options.maxPages ?? 200;
  if (detectMagicMimeType(bytes) !== 'application/pdf') {
    throw AppError.unsupportedMedia('INVALID_PDF_HEADER', 'Input does not begin with a valid %PDF- header.');
  }

  const rawLatin1 = Buffer.from(bytes).toString('latin1');
  if (!rawLatin1.includes('%%EOF')) {
    throw AppError.badRequest('CORRUPTED_PDF', 'PDF is truncated or missing %%EOF trailer.');
  }

  const versionMatch = rawLatin1.match(/^%PDF-(\d+\.\d+)/);
  const pdfVersion = versionMatch ? versionMatch[1] : 'unknown';

  const pageMatches = rawLatin1.match(/\/Type\s*\/Page\b(?!s)/g);
  const pageCount = pageMatches ? pageMatches.length : 1;

  if (pageCount > maxPages) {
    throw AppError.badRequest(
      'PDF_PAGE_LIMIT_EXCEEDED',
      `PDF contains ${pageCount} pages, exceeding the ${maxPages}-page sandbox limit.`
    );
  }

  const hasEncryption = /\/Encrypt\b/.test(rawLatin1);
  if (hasEncryption) {
    throw AppError.badRequest('ENCRYPTED_PDF_REJECTED', 'Password-protected or encrypted PDFs are rejected by policy.');
  }

  const hasEmbeddedScripts = /\/(JavaScript|JS|RichMedia)\b/.test(rawLatin1);
  const hasDangerousActions = /\/(Launch|OpenAction|AA|SubmitForm|ImportData)\b/.test(rawLatin1);
  const hasEmbeddedFiles = /\/EmbeddedFiles\b/.test(rawLatin1);

  if (hasEmbeddedScripts || hasDangerousActions || hasEmbeddedFiles) {
    throw AppError.forbidden(
      'PDF_ACTIVE_CONTENT_BLOCKED',
      'PDF contains active scripts, macros, auto-actions, or embedded files and was quarantined.'
    );
  }

  const uriRegex = /\/URI\s*\(([^)]{1,500})\)/g;
  const externalLinks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = uriRegex.exec(rawLatin1)) !== null) {
    externalLinks.push(match[1]);
    if (externalLinks.length >= 50) break;
  }

  if (options.rejectExternalLinks && externalLinks.length > 0) {
    throw AppError.forbidden('PDF_EXTERNAL_LINKS_BLOCKED', 'PDF contains external URI links disallowed by strict policy.');
  }

  // Scrub sensitive metadata values (/Author, /Creator, /Producer, /Title, /Subject, /Keywords) in-place preserving byte length!
  const metadataKeys = ['Author', 'Creator', 'Producer', 'Title', 'Subject', 'Keywords'];
  const metadataFieldsScrubbed: string[] = [];
  let scrubbed = rawLatin1;

  for (const key of metadataKeys) {
    const pattern = new RegExp(`(\\/${key}\\s*\\()([^)]*)(\\))`, 'g');
    scrubbed = scrubbed.replace(pattern, (_m, prefix: string, val: string, suffix: string) => {
      if (val.trim().length > 0) {
        metadataFieldsScrubbed.push(key);
      }
      // Preserve exact byte offsets for xref table validity by replacing with spaces!
      return `${prefix}${' '.repeat(val.length)}${suffix}`;
    });
  }

  return {
    pdfVersion,
    pageCount,
    hasEncryption,
    hasEmbeddedScripts,
    hasDangerousActions,
    hasEmbeddedFiles,
    externalLinks,
    metadataFieldsScrubbed: Array.from(new Set(metadataFieldsScrubbed)),
    safe: true,
    scrubbedPdfBase64: Buffer.from(scrubbed, 'latin1').toString('base64'),
  };
}

// =============================================================================
// Image Binary Header Decoder, Dimension Bomb Guard & EXIF Stripper (Domain 13 / 14)
// =============================================================================
export interface ImageSanitizeResult {
  format: 'png' | 'jpeg' | 'gif' | 'webp' | 'svg';
  width: number;
  height: number;
  metadataStripped: boolean;
  strippedSegments: string[];
  sanitizedBase64: string;
}

export function sanitizeSvgMarkup(rawSvg: string): string {
  if (/<!(?:DOCTYPE|ENTITY)/i.test(rawSvg)) {
    throw AppError.forbidden('SVG_XXE_BLOCKED', 'XML DOCTYPE and ENTITY declarations are forbidden in SVG files.');
  }
  if (!/<svg[\s>]/i.test(rawSvg)) {
    throw AppError.badRequest('INVALID_SVG', 'Markup does not contain a root <svg> element.');
  }

  let clean = rawSvg
    // Strip dangerous elements completely
    .replace(/<\s*(script|foreignObject|iframe|object|embed|audio|video|canvas|meta|link)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|foreignObject|iframe|object|embed|meta|link)\b[^>]*\/?\s*>/gi, '')
    // Strip inline event handlers (onload=, onerror=, onclick=, etc.)
    .replace(/\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Strip javascript:, vbscript:, data:text/html in href / xlink:href / src / style
    .replace(/\s+(?:xlink:)?href\s*=\s*(?:"\s*(?:javascript:|vbscript:|data:text\/html|https?:\/\/)[^"]*"|'\s*(?:javascript:|vbscript:|data:text\/html|https?:\/\/)[^']*')/gi, '')
    .replace(/url\(\s*['"]?\s*(?:javascript:|https?:\/\/)[^)]*\)/gi, 'none');

  return clean.trim();
}

export function sanitizeHtmlFragment(rawHtml: string): string {
  return rawHtml
    .replace(/<\s*(script|iframe|object|embed|form|base|meta|link|style)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|iframe|object|embed|form|base|meta|link|style)\b[^>]*\/?\s*>/gi, '')
    .replace(/\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(?:id|name)\s*=\s*(?:"(?:location|document|window|top|parent|__proto__|constructor)"|'(?:location|document|window|top|parent|__proto__|constructor)')/gi, '')
    .replace(/(href|src|action|formaction)\s*=\s*(?:"\s*(?:javascript:|vbscript:|data:text\/html)[^"]*"|'\s*(?:javascript:|vbscript:|data:text\/html)[^']*')/gi, '$1="#"');
}

export function inspectAndSanitizeImage(
  bytes: Uint8Array,
  options: { maxDimension?: number; maxTotalPixels?: number } = {}
): ImageSanitizeResult {
  const maxDimension = options.maxDimension ?? 8192;
  const maxTotalPixels = options.maxTotalPixels ?? 36_000_000; // 36 MP cap
  const mime = detectMagicMimeType(bytes);
  const buf = Buffer.from(bytes);

  const checkDimensions = (width: number, height: number) => {
    if (width <= 0 || height <= 0 || width > maxDimension || height > maxDimension || width * height > maxTotalPixels) {
      throw AppError.badRequest(
        'IMAGE_DIMENSION_BOMB_BLOCKED',
        `Image dimensions (${width}x${height}) exceed sandbox policy (${maxDimension}px / ${maxTotalPixels} total pixels).`
      );
    }
  };

  if (mime === 'image/svg+xml') {
    const rawText = buf.toString('utf8');
    const sanitizedSvg = sanitizeSvgMarkup(rawText);
    return {
      format: 'svg',
      width: 1024,
      height: 1024,
      metadataStripped: sanitizedSvg !== rawText,
      strippedSegments: sanitizedSvg !== rawText ? ['svg_unsafe_nodes_or_attrs'] : [],
      sanitizedBase64: Buffer.from(sanitizedSvg, 'utf8').toString('base64'),
    };
  }

  if (mime === 'image/png') {
    if (buf.length < 24 || buf.subarray(12, 16).toString('ascii') !== 'IHDR') {
      throw AppError.badRequest('CORRUPTED_PNG', 'Malformed PNG IHDR header.');
    }
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    checkDimensions(width, height);

    const outChunks: Buffer[] = [buf.subarray(0, 8)];
    const strippedSegments: string[] = [];
    const stripTypes = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME']);
    let offset = 8;

    while (offset + 8 <= buf.length) {
      const length = buf.readUInt32BE(offset);
      const type = buf.subarray(offset + 4, offset + 8).toString('ascii');
      const totalChunkBytes = 12 + length;
      if (offset + totalChunkBytes > buf.length) {
        throw AppError.badRequest('CORRUPTED_PNG', 'Truncated PNG chunk detected.');
      }
      if (stripTypes.has(type)) {
        strippedSegments.push(type);
      } else {
        outChunks.push(buf.subarray(offset, offset + totalChunkBytes));
      }
      offset += totalChunkBytes;
      if (type === 'IEND') break;
    }

    const sanitized = Buffer.concat(outChunks);
    return {
      format: 'png',
      width,
      height,
      metadataStripped: strippedSegments.length > 0,
      strippedSegments,
      sanitizedBase64: sanitized.toString('base64'),
    };
  }

  if (mime === 'image/jpeg') {
    let offset = 2;
    let width = 0;
    let height = 0;
    const outSegments: Buffer[] = [buf.subarray(0, 2)];
    const strippedSegments: string[] = [];

    while (offset + 4 <= buf.length) {
      if (buf[offset] !== 0xff) {
        throw AppError.badRequest('CORRUPTED_JPEG', 'Invalid JPEG marker alignment.');
      }
      while (offset < buf.length && buf[offset] === 0xff) {
        offset += 1;
      }
      const marker = buf[offset];
      offset += 1;

      if (marker === 0xd9) {
        outSegments.push(Buffer.from([0xff, 0xd9]));
        break;
      }
      if (marker === 0xda) {
        // Start of Scan (SOS): copy rest of entropy-coded image stream
        outSegments.push(Buffer.from([0xff, 0xda]));
        outSegments.push(buf.subarray(offset));
        break;
      }
      if (offset + 2 > buf.length) {
        throw AppError.badRequest('CORRUPTED_JPEG', 'Truncated JPEG segment length.');
      }
      const segLength = buf.readUInt16BE(offset);
      if (segLength < 2 || offset + segLength > buf.length) {
        throw AppError.badRequest('CORRUPTED_JPEG', 'Invalid JPEG segment bounds.');
      }

      // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb)
      ) {
        if (segLength >= 7) {
          height = buf.readUInt16BE(offset + 3);
          width = buf.readUInt16BE(offset + 5);
        }
      }

      // Strip APP1 (EXIF/XMP), APP2..APP15 (except APP0 JFIF), and COM (0xFE)
      const isMetadataMarker = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;
      if (isMetadataMarker) {
        strippedSegments.push(marker === 0xe1 ? 'EXIF_APP1' : `MARKER_0x${marker.toString(16)}`);
      } else {
        outSegments.push(Buffer.from([0xff, marker]));
        outSegments.push(buf.subarray(offset, offset + segLength));
      }
      offset += segLength;
    }

    checkDimensions(width, height);
    return {
      format: 'jpeg',
      width,
      height,
      metadataStripped: strippedSegments.length > 0,
      strippedSegments,
      sanitizedBase64: Buffer.concat(outSegments).toString('base64'),
    };
  }

  if (mime === 'image/gif') {
    if (buf.length < 10) {
      throw AppError.badRequest('CORRUPTED_GIF', 'Truncated GIF header.');
    }
    const width = buf.readUInt16LE(6);
    const height = buf.readUInt16LE(8);
    checkDimensions(width, height);
    return {
      format: 'gif',
      width,
      height,
      metadataStripped: false,
      strippedSegments: [],
      sanitizedBase64: buf.toString('base64'),
    };
  }

  if (mime === 'image/webp') {
    if (buf.length < 30) {
      throw AppError.badRequest('CORRUPTED_WEBP', 'Truncated WebP header.');
    }
    const chunkType = buf.subarray(12, 16).toString('ascii');
    let width = 0;
    let height = 0;
    if (chunkType === 'VP8X') {
      width = 1 + buf.readUIntLE(24, 3);
      height = 1 + buf.readUIntLE(27, 3);
    } else if (chunkType === 'VP8 ') {
      width = buf.readUInt16LE(26) & 0x3fff;
      height = buf.readUInt16LE(28) & 0x3fff;
    } else if (chunkType === 'VP8L') {
      const bits = buf.readUInt32LE(21);
      width = (bits & 0x3fff) + 1;
      height = ((bits >> 14) & 0x3fff) + 1;
    }
    checkDimensions(width, height);
    return {
      format: 'webp',
      width,
      height,
      metadataStripped: false,
      strippedSegments: [],
      sanitizedBase64: buf.toString('base64'),
    };
  }

  throw AppError.unsupportedMedia('UNSUPPORTED_IMAGE_FORMAT', 'Unsupported image format.');
}

// =============================================================================
// ZIP Archive Bomb & Zip-Slip Inspector (Domain 11 / Security 12)
// =============================================================================
export interface ZipAuditReport {
  entryCount: number;
  totalCompressedBytes: number;
  totalUncompressedBytes: number;
  maxCompressionRatio: number;
  entries: Array<{ name: string; compressedBytes: number; uncompressedBytes: number }>;
  safe: boolean;
}

export function inspectZipArchive(
  bytes: Uint8Array,
  options: { maxEntries?: number; maxTotalUncompressedBytes?: number; maxRatio?: number } = {}
): ZipAuditReport {
  const maxEntries = options.maxEntries ?? 150;
  const maxTotalUncompressedBytes = options.maxTotalUncompressedBytes ?? 52_428_800; // 50 MiB
  const maxRatio = options.maxRatio ?? 80;

  if (detectMagicMimeType(bytes) !== 'application/zip') {
    throw AppError.unsupportedMedia('INVALID_ZIP_SIGNATURE', 'Input is not a valid ZIP archive.');
  }

  const buf = Buffer.from(bytes);
  let offset = 0;
  let totalCompressed = 0;
  let totalUncompressed = 0;
  let maxObservedRatio = 1;
  const entries: Array<{ name: string; compressedBytes: number; uncompressedBytes: number }> = [];

  while (offset + 4 <= buf.length) {
    const sig = buf.readUInt32LE(offset);
    if (sig !== 0x04034b50) {
      break; // Reached Central Directory (0x02014b50) or EOCD (0x06054b50)
    }
    if (offset + 30 > buf.length) {
      throw AppError.badRequest('CORRUPTED_ZIP', 'Truncated ZIP local file header.');
    }

    const flags = buf.readUInt16LE(offset + 6);
    if ((flags & 0x0001) !== 0) {
      throw AppError.forbidden('ENCRYPTED_ZIP_BLOCKED', 'Encrypted ZIP archives cannot be inspected and are blocked.');
    }

    const compressedSize = buf.readUInt32LE(offset + 18);
    const uncompressedSize = buf.readUInt32LE(offset + 22);
    const fileNameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);

    const headerEnd = offset + 30 + fileNameLen + extraLen;
    if (headerEnd > buf.length) {
      throw AppError.badRequest('CORRUPTED_ZIP', 'Truncated ZIP entry metadata.');
    }

    const entryName = buf.subarray(offset + 30, offset + 30 + fileNameLen).toString('utf8');
    if (
      entryName.includes('\0') ||
      entryName.includes('..') ||
      entryName.startsWith('/') ||
      entryName.includes('\\') ||
      /^[a-zA-Z]:/.test(entryName)
    ) {
      throw AppError.forbidden(
        'ZIP_SLIP_PATH_TRAVERSAL',
        `ZIP entry "${entryName.slice(0, 60)}" contains forbidden path traversal characters.`
      );
    }

    entries.push({
      name: entryName,
      compressedBytes: compressedSize,
      uncompressedBytes: uncompressedSize,
    });

    if (entries.length > maxEntries) {
      throw AppError.badRequest(
        'ZIP_ENTRY_COUNT_EXCEEDED',
        `ZIP archive exceeds maximum entry count (${maxEntries}).`
      );
    }

    totalCompressed += compressedSize;
    totalUncompressed += uncompressedSize;

    if (totalUncompressed > maxTotalUncompressedBytes) {
      throw AppError.payloadTooLarge(
        'ZIP_UNCOMPRESSED_QUOTA_EXCEEDED',
        `ZIP uncompressed size exceeds ${maxTotalUncompressedBytes} bytes limit.`
      );
    }

    const ratio = compressedSize > 0 ? uncompressedSize / compressedSize : uncompressedSize;
    if (ratio > maxObservedRatio) {
      maxObservedRatio = Number(ratio.toFixed(2));
    }
    if (ratio > maxRatio && uncompressedSize > 65_536) {
      throw AppError.forbidden(
        'ZIP_BOMB_DETECTED',
        `Compression ratio (${ratio.toFixed(1)}:1) exceeds anti-zip-bomb threshold (${maxRatio}:1).`
      );
    }

    offset = headerEnd + compressedSize;
  }

  return {
    entryCount: entries.length,
    totalCompressedBytes: totalCompressed,
    totalUncompressedBytes: totalUncompressed,
    maxCompressionRatio: maxObservedRatio,
    entries,
    safe: true,
  };
}

// =============================================================================
// Audio / Video Container Inspector & Safe FFmpeg Subprocess Args (Domain 14)
// =============================================================================
export const ALLOWED_MEDIA_CODECS = new Set(['h264', 'aac', 'mp3', 'pcm_s16le', 'vp9', 'opus']);

export interface MediaInspectionReport {
  containerMime: string;
  estimatedDurationSeconds: number;
  maxDurationSeconds: number;
  allowedCodecs: string[];
  safeFfmpegArgsPreview: string[];
}

export function inspectMediaContainer(
  bytes: Uint8Array,
  options: { maxDurationSeconds?: number } = {}
): MediaInspectionReport {
  const maxDurationSeconds = options.maxDurationSeconds ?? 300;
  const mime = detectMagicMimeType(bytes);
  if (!mime || !['video/mp4', 'audio/mpeg', 'audio/wav'].includes(mime)) {
    throw AppError.unsupportedMedia('UNSUPPORTED_MEDIA_CONTAINER', 'Only MP4, MP3, and WAV containers are permitted.');
  }

  const buf = Buffer.from(bytes);
  let durationSec = 0;

  if (mime === 'audio/wav' && buf.length >= 44) {
    const byteRate = buf.readUInt32LE(28);
    const dataSize = Math.max(0, buf.length - 44);
    if (byteRate > 0) {
      durationSec = Number((dataSize / byteRate).toFixed(2));
    }
  } else if (mime === 'video/mp4') {
    // Locate 'mvhd' atom to read timescale & duration
    const mvhdIdx = buf.indexOf(Buffer.from('mvhd', 'ascii'));
    if (mvhdIdx >= 4 && mvhdIdx + 24 <= buf.length) {
      const version = buf[mvhdIdx + 4];
      if (version === 0 && mvhdIdx + 24 <= buf.length) {
        const timescale = buf.readUInt32BE(mvhdIdx + 16);
        const duration = buf.readUInt32BE(mvhdIdx + 20);
        if (timescale > 0) {
          durationSec = Number((duration / timescale).toFixed(2));
        }
      }
    }
  } else if (mime === 'audio/mpeg') {
    // Conservative estimate at 128 kbps if VBR header absent
    durationSec = Number((buf.length / 16000).toFixed(2));
  }

  if (durationSec > maxDurationSeconds) {
    throw AppError.badRequest(
      'MEDIA_DURATION_LIMIT_EXCEEDED',
      `Media duration (${durationSec}s) exceeds maximum allowed (${maxDurationSeconds}s).`
    );
  }

  return {
    containerMime: mime,
    estimatedDurationSeconds: durationSec,
    maxDurationSeconds,
    allowedCodecs: Array.from(ALLOWED_MEDIA_CODECS),
    safeFfmpegArgsPreview: buildSafeFfmpegArgs('/sandbox/in.media', '/sandbox/out.mp4', {
      maxDurationSeconds,
      videoCodec: 'h264',
      audioCodec: 'aac',
    }),
  };
}

export function buildSafeFfmpegArgs(
  isolatedInputPath: string,
  isolatedOutputPath: string,
  options: { maxDurationSeconds?: number; videoCodec?: string; audioCodec?: string } = {}
): string[] {
  const maxDuration = Math.min(Math.max(1, options.maxDurationSeconds ?? 300), 3600);
  const vCodec = options.videoCodec ?? 'h264';
  const aCodec = options.audioCodec ?? 'aac';

  if (!ALLOWED_MEDIA_CODECS.has(vCodec) || !ALLOWED_MEDIA_CODECS.has(aCodec)) {
    throw AppError.badRequest('FORBIDDEN_MEDIA_CODEC', 'Requested media codec is not in the approved allowlist.');
  }
  if (isolatedInputPath.startsWith('-') || isolatedOutputPath.startsWith('-')) {
    throw AppError.badRequest('SUBPROCESS_ARG_INJECTION_BLOCKED', 'File paths cannot start with a hyphen (-).');
  }

  return [
    '-nostdin',
    '-y',
    '-loglevel',
    'error',
    '-protocol_whitelist',
    'file', // Blocks FFmpeg SSRF / HLS / concat / network protocols!
    '-i',
    isolatedInputPath,
    '-t',
    String(maxDuration),
    '-map_metadata',
    '-1', // Strips container metadata
    '-c:v',
    vCodec === 'h264' ? 'libx264' : vCodec,
    '-c:a',
    aCodec,
    isolatedOutputPath,
  ];
}
