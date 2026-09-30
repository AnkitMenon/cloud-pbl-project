import { useEffect, useMemo, useState } from 'react'
import { Download, Share2, Trash2, Upload, Search, LogOut, Link2, FolderOpen, Loader2, RefreshCw } from 'lucide-react'
import Logo from '../components/Logo'
import FileIcon from '../components/FileIcon'
import UploadModal from '../components/UploadModal'
import ShareModal from '../components/ShareModal'
import ConfirmDelete from '../components/ConfirmDelete'
import { useToast } from '../components/Toast'
import { useAuth } from '../lib/auth'
import api, { downloadWithAuth, errorMessage } from '../lib/api'
import { fileExtension, formatBytes, formatDate, formatDateTime } from '../lib/format'

function Stat({ label, value, hint, className = '' }) {
  return (
    <div className={`rounded-2xl border border-line bg-white px-5 py-4 ${className}`}>
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="num mt-1 text-2xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  )
}

function IconButton({ label, onClick, danger, active, busy, children }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      title={label}
      aria-label={label}
      className={`rounded-lg p-2 transition disabled:opacity-50 ${
        danger ? 'text-muted hover:bg-danger/8 hover:text-danger'
          : active ? 'text-vault hover:bg-vault-soft' : 'text-muted hover:bg-paper hover:text-ink'
      }`}
    >
      {busy ? <Loader2 size={18} className="animate-spin" /> : children}
    </button>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const [data, setData] = useState({ files: [], total_files: 0, total_size: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [sharing, setSharing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  const load = async () => {
    setLoadError('')
    try {
      const res = await api.get('/files')
      setData(res.data)
    } catch (err) {
      setLoadError(await errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const files = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? data.files.filter((f) => f.original_filename.toLowerCase().includes(q)) : data.files
  }, [data.files, query])

  const sharedCount = data.files.filter((f) => f.share_token).length

  const updateFile = (id, patch) =>
    setData((d) => ({ ...d, files: d.files.map((f) => (f.id === id ? { ...f, ...patch } : f)) }))

  const onUploaded = (file) =>
    setData((d) => ({ files: [file, ...d.files], total_files: d.total_files + 1, total_size: d.total_size + file.file_size }))

  const download = async (file) => {
    setDownloadingId(file.id)
    try {
      await downloadWithAuth(file.id, file.original_filename)
      toast.success(`Downloading ${file.original_filename}`)
    } catch (err) {
      toast.error(await errorMessage(err))
    } finally {
      setDownloadingId(null)
    }
  }

  const confirmDelete = async () => {
    const file = deleting
    try {
      await api.delete(`/files/${file.id}`)
      setData((d) => ({
        files: d.files.filter((f) => f.id !== file.id),
        total_files: d.total_files - 1,
        total_size: d.total_size - file.file_size,
      }))
      toast.success(`Deleted ${file.original_filename}`)
    } catch (err) {
      toast.error(await errorMessage(err))
    }
    setDeleting(null)
  }

  const actions = (f) => (
    <div className="flex items-center justify-end gap-0.5">
      <IconButton label="Download" onClick={() => download(f)} busy={downloadingId === f.id}><Download size={18} /></IconButton>
      <IconButton label={f.share_token ? 'Shared — view link' : 'Share'} active={!!f.share_token} onClick={() => setSharing(f)}>
        {f.share_token ? <Link2 size={18} /> : <Share2 size={18} />}
      </IconButton>
      <IconButton label="Delete" danger onClick={() => setDeleting(f)}><Trash2 size={18} /></IconButton>
    </div>
  )

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-vault-soft text-sm font-extrabold text-vault uppercase">
                {user.username[0]}
              </span>
              <span className="hidden text-sm font-semibold sm:block">{user.username}</span>
            </span>
            <button onClick={logout} className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-muted hover:bg-paper hover:text-ink">
              <LogOut size={17} /> <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">My files</h1>
            <p className="mt-1 text-muted">Everything you've uploaded to CloudVault.</p>
          </div>
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 rounded-xl bg-vault px-5 py-3 font-bold text-white shadow-sm shadow-vault/30 transition hover:bg-vault-dark">
            <Upload size={18} /> Upload file
          </button>
        </div>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Total files" value={loading ? '–' : data.total_files} />
          <Stat label="Storage used" value={loading ? '–' : formatBytes(data.total_size)} />
          <Stat label="Shared links" value={loading ? '–' : sharedCount} hint="Files anyone with the link can open" className="col-span-2 sm:col-span-1" />
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Search size={18} className="shrink-0 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your files by name"
              aria-label="Search files" className="min-w-0 flex-1 bg-transparent py-1 outline-none placeholder:text-muted/70" />
            {query && <span className="num shrink-0 text-sm text-muted">{files.length} of {data.files.length}</span>}
          </div>

          {loading ? (
            <ul aria-label="Loading files">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex animate-pulse items-center gap-3 border-b border-line px-4 py-4 last:border-0">
                  <span className="h-10 w-10 rounded-xl bg-paper" />
                  <span className="h-4 flex-1 rounded bg-paper" />
                  <span className="hidden h-4 w-24 rounded bg-paper sm:block" />
                </li>
              ))}
            </ul>
          ) : loadError ? (
            <div className="px-6 py-14 text-center">
              <p className="font-semibold text-danger">{loadError}</p>
              <button onClick={() => { setLoading(true); load() }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 font-semibold hover:bg-paper">
                <RefreshCw size={16} /> Try again
              </button>
            </div>
          ) : data.files.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-vault-soft text-vault">
                <FolderOpen size={26} />
              </span>
              <p className="mt-4 text-lg font-bold">No files yet</p>
              <p className="mx-auto mt-1 max-w-xs text-muted">Upload your first file to store it on the server and share it with a link.</p>
              <button onClick={() => setShowUpload(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-vault px-5 py-2.5 font-bold text-white hover:bg-vault-dark">
                <Upload size={17} /> Upload file
              </button>
            </div>
          ) : files.length === 0 ? (
            <div className="px-6 py-14 text-center text-muted">
              No files match “<span className="font-semibold text-ink">{query}</span>”.{' '}
              <button onClick={() => setQuery('')} className="font-semibold text-vault hover:underline">Clear search</button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <table className="hidden w-full table-fixed text-left md:table">
                <colgroup>
                  <col />
                  <col className="w-24" />
                  <col className="w-24" />
                  <col className="w-36" />
                  <col className="w-40" />
                </colgroup>
                <thead>
                  <tr className="border-b border-line text-sm text-muted">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 text-right font-semibold">Size</th>
                    <th className="px-4 py-3 font-semibold">Uploaded</th>
                    <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f) => (
                    <tr key={f.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <FileIcon type={f.file_type} />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold" title={f.original_filename}>{f.original_filename}</span>
                            {f.share_token && <span className="text-xs font-semibold text-vault">Shared by link</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-paper px-2 py-1 text-xs font-bold text-muted">{fileExtension(f.original_filename)}</span>
                      </td>
                      <td className="num px-4 py-3 text-right text-sm whitespace-nowrap">{formatBytes(f.file_size)}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-muted" title={formatDateTime(f.upload_date)}>{formatDate(f.upload_date)}</td>
                      <td className="px-3 py-3">{actions(f)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile list */}
              <ul className="md:hidden">
                {files.map((f) => (
                  <li key={f.id} className="border-b border-line px-4 py-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <FileIcon type={f.file_type} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{f.original_filename}</p>
                        <p className="num text-sm text-muted">
                          {fileExtension(f.original_filename)}, {formatBytes(f.file_size)}, {formatDate(f.upload_date)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs font-semibold text-vault">{f.share_token ? 'Shared by link' : ''}</span>
                      {actions(f)}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={onUploaded} />}
      {sharing && (
        <ShareModal
          file={sharing}
          onClose={() => setSharing(null)}
          onShared={(id, token) => updateFile(id, { share_token: token })}
          onUnshared={(id) => updateFile(id, { share_token: null })}
        />
      )}
      {deleting && <ConfirmDelete file={deleting} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />}
    </div>
  )
}
