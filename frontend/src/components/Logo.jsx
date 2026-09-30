export default function Logo({ inverted = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={inverted ? '#fff' : '#2B57E0'} />
        <path d="M9 20.5a4.5 4.5 0 0 1 .9-8.9 6 6 0 0 1 11.4 1.4A3.8 3.8 0 0 1 22 20.5z" fill={inverted ? '#2B57E0' : '#fff'} />
        <rect x="13.5" y="15.5" width="5" height="4" rx="1" fill={inverted ? '#fff' : '#2B57E0'} />
      </svg>
      <span className={`text-lg font-extrabold tracking-tight ${inverted ? 'text-white' : 'text-ink'}`}>CloudVault</span>
    </span>
  )
}
