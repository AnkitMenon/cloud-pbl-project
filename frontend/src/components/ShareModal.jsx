import { useEffect, useState } from 'react'
import { Copy, Check, Loader2, Link2, ExternalLink } from 'lucide-react'
import Modal from './Modal'
import api, { errorMessage } from '../lib/api'
import { useToast } from './Toast'

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for browsers that block the clipboard API on http://
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    el.remove()
    return ok
  }
}

export default function ShareModal({ file, onClose, onShared, onUnshared }) {
  const toast = useToast()
  const [token, setToken] = useState(file.share_token)
  const [loading, setLoading] = useState(!file.share_token)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    if (file.share_token) return
    api.post(`/files/${file.id}/share`)
      .then((res) => { setToken(res.data.share_token); onShared(file.id, res.data.share_token) })
      .catch(async (err) => setError(await errorMessage(err)))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const url = token ? `${window.location.origin}/share/${token}` : ''

  const copy = async () => {
    if (await copyText(url)) {
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } else toast.error('Could not copy. Select the link and copy it manually.')
  }

  const revoke = async () => {
    setRevoking(true)
    try {
      await api.delete(`/files/${file.id}/share`)
      onUnshared(file.id)
      toast.success('Link turned off. The old link no longer works.')
      onClose()
    } catch (err) {
      toast.error(await errorMessage(err))
      setRevoking(false)
    }
  }

  return (
    <Modal title="Share file" onClose={onClose}>
      <p className="text-sm text-muted">
        Anyone with this link can download <span className="font-semibold text-ink">{file.original_filename}</span>. They don't need an account.
      </p>

      {loading && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-paper px-4 py-3.5 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" /> Creating link
        </div>
      )}
      {error && <p role="alert" className="mt-4 rounded-xl bg-danger/8 px-3.5 py-2.5 text-sm font-medium text-danger">{error}</p>}

      {token && (
        <>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-paper p-1.5 pl-3.5">
            <Link2 size={16} className="shrink-0 text-vault" />
            <input readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Share link"
              className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none" />
            <button onClick={copy}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold text-white transition ${copied ? 'bg-ok' : 'bg-vault hover:bg-vault-dark'}`}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <button onClick={revoke} disabled={revoking} className="rounded-xl px-3 py-2 text-sm font-semibold text-danger hover:bg-danger/8 disabled:opacity-50">
              {revoking ? 'Turning off' : 'Turn off link'}
            </button>
            <a href={url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-vault hover:bg-vault-soft">
              Open link <ExternalLink size={15} />
            </a>
          </div>
        </>
      )}
    </Modal>
  )
}
