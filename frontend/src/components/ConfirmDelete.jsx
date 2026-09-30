import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import Modal from './Modal'

export default function ConfirmDelete({ file, onCancel, onConfirm }) {
  const [busy, setBusy] = useState(false)
  const confirm = async () => {
    setBusy(true)
    await onConfirm()
    setBusy(false)
  }

  return (
    <Modal title="Delete file" onClose={busy ? () => {} : onCancel} width="max-w-sm">
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
          <AlertTriangle size={20} />
        </span>
        <p className="text-sm leading-relaxed text-muted">
          <span className="font-semibold break-all text-ink">{file.original_filename}</span> will be removed from storage.
          {file.share_token && ' Its share link will stop working.'} This can't be undone.
        </p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onCancel} disabled={busy} className="rounded-xl px-4 py-2.5 font-semibold text-muted hover:bg-paper hover:text-ink">Keep file</button>
        <button onClick={confirm} disabled={busy}
          className="flex items-center gap-2 rounded-xl bg-danger px-5 py-2.5 font-bold text-white hover:bg-danger/90 disabled:opacity-60">
          {busy && <Loader2 size={17} className="animate-spin" />}
          Delete
        </button>
      </div>
    </Modal>
  )
}
