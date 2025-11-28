// ----------------------------------------------------------------------

/**
 * 根据文件扩展名获取 MIME 类型
 */
export function getMimeTypeFromExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const mimeTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    bmp: 'image/bmp',
    // Videos
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    flac: 'audio/flac',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    csv: 'text/csv',
    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    // Code
    js: 'application/javascript',
    ts: 'application/typescript',
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
    css: 'text/css',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 根据文件扩展名获取文件类型图标
 */
export function getFileIconFromExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'].includes(ext)) {
    return 'solar:gallery-bold-duotone';
  }
  // Videos
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) {
    return 'solar:videocamera-record-bold-duotone';
  }
  // Audio
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
    return 'solar:music-note-bold-duotone';
  }
  // PDF
  if (['pdf'].includes(ext)) {
    return 'solar:document-bold-duotone';
  }
  // Word
  if (['doc', 'docx'].includes(ext)) {
    return 'solar:document-text-bold-duotone';
  }
  // Excel
  if (['xls', 'xlsx'].includes(ext)) {
    return 'solar:table-bold-duotone';
  }
  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return 'solar:archive-bold-duotone';
  }

  return 'solar:file-bold-duotone';
}

/**
 * 根据 Content-Type 或文件扩展名获取文件类型图标
 */
export function getFileIcon(contentType?: string, fileName?: string): string {
  if (!contentType && !fileName) return 'solar:file-bold-duotone';

  const type = contentType?.split('/')[0] || '';
  const ext = fileName?.split('.').pop()?.toLowerCase() || '';

  // 优先使用 Content-Type
  if (type === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return 'solar:gallery-bold-duotone';
  }
  if (type === 'video' || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) {
    return 'solar:videocamera-record-bold-duotone';
  }
  if (type === 'audio' || ['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) {
    return 'solar:music-note-bold-duotone';
  }
  if (['pdf'].includes(ext)) {
    return 'solar:document-bold-duotone';
  }
  if (['doc', 'docx'].includes(ext)) {
    return 'solar:document-text-bold-duotone';
  }
  if (['xls', 'xlsx'].includes(ext)) {
    return 'solar:table-bold-duotone';
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return 'solar:archive-bold-duotone';
  }

  return 'solar:file-bold-duotone';
}

