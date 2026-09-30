import { useRef, useState } from 'react'
import { UploadCloud, Loader2, X, CheckCircle2 } from 'lucide-react'
import Modal from './Modal'
import FileIcon from './FileIcon'
import api, { errorMessage } from '../lib/api'
import { formatBytes, MAX_FILE_MB } from '../lib/format'

export default function UploadModal({ onClose, onUploaded }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle') // idle | uploading | done | error
  const [message, setMessage] = useState('')

  const pick = (f) => {
    if (!f) return
    setFile(f)
    setStatus('idle')
    setProgress(0)
    if (f.size === 0) { setStatus('error'); setMessage('This file is empty. Choose a file with content.') }
    else if (f.size > MAX_FILE_MB * 1024 * 1024) { setStatus('error'); setMessage(`This file is ${formatBytes(f.size)}. The limit is ${MAX_FILE_MB} MB.`) }
    else setMessage('')
  }

  const upload = async () => {
    const data = new FormData()
    data.append('file', file)
    setStatus('uploading')
    try {
      const res = await api.post('/files/upload', data, {
        onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)),
      })
      setProgress(100)
      setStatus('done')
      setMessage(`${res.data.original_filename} uploaded.`)
      onUploaded(res.data)
    } catch (err) {
      setStatus('error')
      setMessage(await errorMessage(err))
    }
  }

  const reset = () => { setFile(null); setStatus('idle'); setMessage(''); setProgress(0) }
  const busy = status === 'uploading'

  return (
    <Modal title="Upload a file" onClose={busy ? () => {} : onClose}>
      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]) }}
          className={`flex w-full flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
            dragging ? 'border-vault bg-vault-soft' : 'border-line hover:border-vault/50 hover:bg-paper'
          }`}
        >
          <UploadCloud size={36} className="text-vault" strokeWidth={1.6} />
          <span className="mt-3 font-bold">Drop a file here or click to browse</span>
          <span className="mt-1 text-sm text-muted">Documents, images, audio, video, archives and code, up to {MAX_FILE_MB} MB</span>
        </button>
      ) : (
        <div className="rounded-2xl border border-line p-4">
          <div className="flex items-center gap-3">
            <FileIcon type={file.type} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold" title={file.name}>{file.name}</p>
              <p className="num text-sm text-muted">{formatBytes(file.size)}</p>
            </div>
            {!busy && status !== 'done' && (
              <button onClick={reset} className="rounded-lg p-1.5 text-muted hover:bg-paper hover:text-ink" aria-label="Remove file">
                <X size={18} />
              </button>
            )}
            {status === 'done' && <CheckCircle2 size={22} className="text-ok" />}
          </div>
          {(busy || status === 'done') && (
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-paper">
                <div className={`h-full rounded-full transition-all ${status === 'done' ? 'bg-ok' : 'bg-vault'}`} style={{ width: `${progress}%` }} />
              </div>
              <p className="num mt-1.5 text-right text-xs font-semibold text-muted">{progress}%</p>
            </div>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" className="hidden" onChange={(e) => { pick(e.target.files[0]); e.target.value = '' }} />

      {message && (
        <p role="status" className={`mt-4 rounded-xl px-3.5 py-2.5 text-sm font-medium ${status === 'error' ? 'bg-danger/8 text-danger' : 'bg-ok/10 text-ok'}`}>
          {message}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        {status === 'done' ? (
          <>
            <button onClick={reset} className="rounded-xl px-4 py-2.5 font-semibold text-muted hover:bg-paper hover:text-ink">Upload another</button>
            <button onClick={onClose} className="rounded-xl bg-vault px-5 py-2.5 font-bold text-white hover:bg-vault-dark">Done</button>
          </>
        ) : (
          <>
            <button onClick={onClose} disabled={busy} className="rounded-xl px-4 py-2.5 font-semibold text-muted hover:bg-paper hover:text-ink disabled:opacity-40">Cancel</button>
            <button onClick={upload} disabled={!file || busy || status === 'error'}
              className="flex items-center gap-2 rounded-xl bg-vault px-5 py-2.5 font-bold text-white hover:bg-vault-dark disabled:opacity-40">
              {busy && <Loader2 size={17} className="animate-spin" />}
              {busy ? 'Uploading' : 'Upload'}
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}
