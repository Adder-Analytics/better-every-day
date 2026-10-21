// Carry your tasks to another device as a link. Everything lives in this
// browser, so getting it onto a phone used to mean saving a backup file and
// moving that file across. A link is easier to send to yourself (AirDrop, a
// message, an email), and opening it on the other device offers to add what it
// holds.
//
// The link carries the same backup the "Your data" card exports, compressed and
// base64url-encoded into the URL's fragment (`/#bed=...`). Browsers never send
// the fragment to the server, so it goes only where the link itself is sent.
// The receiving side clears it from the address bar as soon as it's read.

const PREFIX = '#bed='
// Refuse to inflate past this, so a hand-made link can't balloon memory.
const MAX_BYTES = 20 * 1024 * 1024

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(code: string): Uint8Array {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

// A link to this site that carries `json` (a serialized backup).
export async function makeTransferLink(json: string): Promise<string> {
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer())
  return `${location.origin}/${PREFIX}${toBase64Url(bytes)}`
}

// The encoded payload in the current address, or null if there isn't one.
export function readTransferHash(): string | null {
  const hash = location.hash
  return hash.startsWith(PREFIX) && hash.length > PREFIX.length ? hash.slice(PREFIX.length) : null
}

// Take the payload out of the address bar (and this history entry), so a
// reload doesn't offer it again and the data doesn't sit in the URL.
export function clearTransferHash(): void {
  history.replaceState(history.state, '', location.pathname + location.search)
}

// Inflate a payload back into the backup's JSON text. Throws a readable
// message when the link is damaged — most often cut short while being copied.
export async function readTransferLink(code: string): Promise<string> {
  const damaged = 'That link couldn’t be read. It may have been cut short when it was copied.'
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser can’t open task links. Use Export and Import instead.')
  }
  try {
    const stream = new Blob([fromBase64Url(code) as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
    const reader = stream.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > MAX_BYTES) {
        await reader.cancel()
        throw new Error('too large')
      }
      chunks.push(value)
    }
    return await new Blob(chunks as BlobPart[]).text()
  } catch {
    throw new Error(damaged)
  }
}
