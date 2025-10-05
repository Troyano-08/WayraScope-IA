const FILENAME_STAR_REGEX = /filename\*\s*=\s*([^;]+)/i
const FILENAME_QUOTED_REGEX = /filename\s*=\s*"?([^";]+)"?/i

const decodeFilenameValue = (value: string): string => {
  const cleaned = value.trim().replace(/^["']|["']$/g, '')
  if (cleaned.includes("''")) {
    const [, rest] = cleaned.split("''", 2)
    return decodeFilenameValue(rest ?? cleaned)
  }
  if (/%[0-9A-Fa-f]{2}/.test(cleaned)) {
    try {
      return decodeURIComponent(cleaned)
    } catch {
      return cleaned
    }
  }
  return cleaned
}

export function parseFilenameFromContentDisposition(header?: string): string | undefined {
  if (!header) return undefined

  const starMatch = header.match(FILENAME_STAR_REGEX)
  if (starMatch && starMatch[1]) {
    const value = decodeFilenameValue(starMatch[1])
    if (value) return value
  }

  const quotedMatch = header.match(FILENAME_QUOTED_REGEX)
  if (quotedMatch && quotedMatch[1]) {
    const value = decodeFilenameValue(quotedMatch[1])
    if (value) return value
  }

  return undefined
}

export const sanitizeFilenameSegment = (value: string): string => {
  if (!value) return 'file'
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function saveBlobAsFile(blob: Blob, filename: string): void {
  const win = window as Window & typeof globalThis & { navigator: { msSaveBlob?: (blob: Blob, name?: string) => void } }

  if (typeof win.navigator.msSaveBlob === 'function') {
    // Soporte para Edge/IE heredado
    win.navigator.msSaveBlob(blob, filename)
    return
  }

  const url = window.URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  window.URL.revokeObjectURL(url)
}
