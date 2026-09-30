import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Download, LinkIcon, Loader2 } from 'lucide-react'
import Logo from '../components/Logo'
import FileIcon from '../components/FileIcon'
import api, { API_URL, errorMessage } from '../lib/api'
import { fileExtension, formatBytes, formatDate } from '../lib/format'

export default function SharedFile() {
  const { token } = useParams()
  const [info, setInfo] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/share/${encodeURIComponent(token)}/info`)
      .then((res) => setInfo(res.data))
      .catch(async (err) => setError(await errorMessage(err)))
  }, [token])

  // Public endpoint: a plain link works, no token needed.
  const downloadUrl = `${API_URL}/share/${encodeURIComponent(token)}`

  return (
    <div className="flex min-h-screen flex-col px-4 py-6 sm:px-8">
      <Link to="/" className="self-start"><Logo /></Link>

      <main className="mx-auto my-auto w-full max-w-md py-10">
        {!info && !error && (
          <div className="flex items-center justify-center gap-2 text-muted">
            <Loader2 size={18} className="animate-spin" /> Opening shared file
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-line bg-white p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
              <LinkIcon size={26} />
            </span>
            <h1 className="mt-4 text-xl font-extrabold">Link not available</h1>
            <p className="mt-1.5 text-muted">{error}. Ask the person who shared it for a new link.</p>
          </div>
        )}

        {info && (
          <div className="pop-in rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
            <div className="flex justify-center"><FileIcon type={info.file_type} size="lg" /></div>
            <p className="mt-5 text-sm text-muted"><span className="font-semibold text-ink">{info.shared_by}</span> shared a file with you</p>
            <h1 className="mt-1 text-xl font-extrabold break-all">{info.original_filename}</h1>
            <p className="num mt-2 text-sm text-muted">
              {fileExtension(info.original_filename)} file, {formatBytes(info.file_size)}, uploaded {formatDate(info.upload_date)}
            </p>
            <a href={downloadUrl}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-vault py-3 font-bold text-white transition hover:bg-vault-dark">
              <Download size={18} /> Download file
            </a>
            <p className="mt-4 text-xs text-muted">No account needed. This link works until the owner turns it off.</p>
          </div>
        )}
      </main>

      <p className="text-center text-sm text-muted">
        Want your own space? <Link to="/register" className="font-semibold text-vault hover:underline">Create a CloudVault account</Link>
      </p>
    </div>
  )
}
