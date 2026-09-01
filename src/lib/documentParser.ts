// Document validation, extraction, and formatting utilities for Feature 7 Files Context

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const SUPPORTED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'md'] as const;
export type SupportedExtension = typeof SUPPORTED_EXTENSIONS[number];

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toLowerCase();
}

export function isSupportedDocument(file: File): { supported: boolean; extension: string; error?: string } {
  const ext = getFileExtension(file.name);
  
  if (!ext || !SUPPORTED_EXTENSIONS.includes(ext as SupportedExtension)) {
    return {
      supported: false,
      extension: ext,
      error: `Unsupported file type ".${ext || 'unknown'}". Please choose a PDF, DOC, DOCX, TXT, or MD document.`,
    };
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return {
      supported: false,
      extension: ext,
      error: `File size (${formatFileSize(file.size)}) exceeds the 10MB maximum limit. Please choose a smaller document.`,
    };
  }

  return { supported: true, extension: ext };
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getDocumentTypeLabel(extension: string): string {
  switch (extension.toLowerCase()) {
    case 'pdf':
      return 'PDF Document';
    case 'docx':
    case 'doc':
      return 'Word Document';
    case 'md':
      return 'Markdown Document';
    case 'txt':
      return 'Plain Text';
    default:
      return 'Document';
  }
}

// Sanitizes extracted text to prevent script execution, excessive length, or machine garbage
export function sanitizeExtractedText(raw: string, maxChars: number = 6000): string {
  if (!raw || typeof raw !== 'string') return '';
  
  // Remove non-printable control characters while preserving newlines and tabs
  let cleaned = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim excessive repeated whitespace/newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  if (cleaned.length > maxChars) {
    return cleaned.slice(0, maxChars) + '...\n\n[Content truncated for journal context]';
  }

  return cleaned;
}

// Reads file as DataURL for safe client-side preview / download triggers
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to load file data.'));
    reader.readAsDataURL(file);
  });
}

// Document text extractor for TXT, MD, DOCX, and PDF
export async function extractDocumentText(
  file: File,
  extension: string,
  preloadedDataUrl?: string
): Promise<string | null> {
  try {
    const ext = extension.toLowerCase();

    // 1. Text and Markdown: Native fast UTF-8 reader
    if (ext === 'txt' || ext === 'md') {
      const text = await file.text();
      return sanitizeExtractedText(text);
    }

    // 2. PDF Document: Safe server-side text extraction via PDFParse
    if (ext === 'pdf') {
      try {
        const dataUrl = preloadedDataUrl || (await readFileAsDataUrl(file));
        const response = await fetch('/api/document/extract-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dataUrl,
            fileName: file.name,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.success && typeof data.text === 'string' && data.text.trim().length > 0) {
            return sanitizeExtractedText(data.text);
          }
        }
      } catch (pdfErr) {
        console.warn('[DocumentParser] PDF extraction API notice:', pdfErr);
      }
      return null;
    }

    // 3. DOCX text extraction
    if (ext === 'docx') {
      try {
        const text = await file.text();
        // DOCX is a zipped archive. If read as text, extract text between <w:t> tags if present
        const matches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (matches && matches.length > 0) {
          const docxText = matches
            .map(m => m.replace(/<[^>]+>/g, ''))
            .join(' ');
          if (docxText.trim().length > 10) {
            return sanitizeExtractedText(docxText);
          }
        }
      } catch {
        // Fall through to null
      }
      return null;
    }

    // DOC / other binary formats: return null for safe fallback
    return null;
  } catch (err) {
    console.warn('[DocumentParser] Extraction notice:', err);
    return null;
  }
}
