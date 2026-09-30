import { FileText, FileImage, FileVideo, FileAudio, FileArchive, FileCode, FileSpreadsheet, File, Presentation } from 'lucide-react'

const KINDS = [
  { test: /^image\//, icon: FileImage, color: 'text-fuchsia-600 bg-fuchsia-50' },
  { test: /^video\//, icon: FileVideo, color: 'text-orange-600 bg-orange-50' },
  { test: /^audio\//, icon: FileAudio, color: 'text-amber-600 bg-amber-50' },
  { test: /pdf/, icon: FileText, color: 'text-red-600 bg-red-50' },
  { test: /zip|rar|7z|compressed/, icon: FileArchive, color: 'text-stone-600 bg-stone-100' },
  { test: /sheet|excel|csv/, icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50' },
  { test: /presentation|powerpoint/, icon: Presentation, color: 'text-orange-600 bg-orange-50' },
  { test: /word|document/, icon: FileText, color: 'text-blue-600 bg-blue-50' },
  { test: /json|javascript|python|html|css|x-ipynb/, icon: FileCode, color: 'text-violet-600 bg-violet-50' },
  { test: /^text\//, icon: FileText, color: 'text-slate-600 bg-slate-100' },
]

export function fileKind(mime = '') {
  return KINDS.find((k) => k.test.test(mime)) || { icon: File, color: 'text-slate-600 bg-slate-100' }
}

export default function FileIcon({ type, size = 'md' }) {
  const { icon: Icon, color } = fileKind(type)
  const box = size === 'lg' ? 'h-14 w-14 rounded-2xl' : 'h-10 w-10 rounded-xl'
  const iconSize = size === 'lg' ? 26 : 19
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${box} ${color}`}>
      <Icon size={iconSize} strokeWidth={1.9} />
    </span>
  )
}
