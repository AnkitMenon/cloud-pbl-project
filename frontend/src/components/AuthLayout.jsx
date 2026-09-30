import { Monitor, Atom, Server, KeyRound, Database } from 'lucide-react'
import Logo from './Logo'

// The request path a file takes, drawn as the left panel of the auth pages.
const HOPS = [
  { icon: Monitor, name: 'Your browser', detail: 'Any device, anywhere' },
  { icon: Atom, name: 'React client', detail: 'Vite · Tailwind · Axios' },
  { icon: Server, name: 'FastAPI REST API', detail: 'JSON over HTTP' },
  { icon: KeyRound, name: 'JWT auth layer', detail: 'Bcrypt-hashed passwords' },
  { icon: Database, name: 'SQLite + file storage', detail: 'Swappable for Postgres + S3' },
]

function AuthPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-vault px-12 py-10 text-white lg:flex lg:flex-col">
      <Logo inverted />
      <div className="my-auto max-w-sm">
        <h2 className="text-3xl leading-tight font-extrabold tracking-tight">
          Your files, kept on a server and reachable from any browser.
        </h2>
        <ol className="mt-10">
          {HOPS.map(({ icon: Icon, name, detail }, i) => (
            <li key={name} className="relative flex gap-4 pb-6 last:pb-0">
              {i < HOPS.length - 1 && (
                <span className="absolute top-10 left-[19px] h-[calc(100%-2.5rem)] w-px bg-white/30" aria-hidden="true">
                  <span
                    className="absolute left-[-2px] h-1.5 w-1.5 rounded-full bg-white"
                    style={{ top: '40%', animation: `pulse-dot 1.8s ${i * 0.3}s infinite` }}
                  />
                </span>
              )}
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/25">
                <Icon size={19} />
              </span>
              <span className="pt-0.5">
                <span className="block font-bold">{name}</span>
                <span className="block text-sm text-white/70">{detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <p className="text-sm text-white/60">Cloud Computing PBL</p>
    </aside>
  )
}

export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(420px,5fr)_7fr]">
      <AuthPanel />
      <main className="flex flex-col px-4 py-8 sm:px-8">
        <div className="lg:hidden"><Logo /></div>
        <div className="mx-auto my-auto w-full max-w-sm py-10">{children}</div>
      </main>
    </div>
  )
}

export function Field({ label, error, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      <input
        {...props}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-[15px] transition outline-none placeholder:text-muted/60 focus:ring-4 ${
          error ? 'border-danger focus:ring-danger/15' : 'border-line focus:border-vault focus:ring-vault/15'
        }`}
      />
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  )
}
