import { useEffect, useId, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useCatalogSearch } from '@/features/catalog/use-catalog-search'
import { cn } from '@/lib/utils'

const DEBOUNCE_MS = 300

interface SearchFieldProps {
  placeholder?: string
  onSearch?: () => void
  className?: string
  inputClassName?: string
}

function SearchField({
  placeholder = 'Buscar por nome, coleção ou token',
  onSearch,
  className,
  inputClassName,
}: SearchFieldProps) {
  const { search, update } = useCatalogSearch()
  const id = useId()
  const [value, setValue] = useState(search.q ?? '')
  const pushed = useRef(search.q)

  useEffect(() => {
    if (search.q !== pushed.current) {
      pushed.current = search.q
      setValue(search.q ?? '')
    }
  }, [search.q])

  useEffect(() => {
    const q = value.trim() || undefined
    if (q === pushed.current) return
    const timer = setTimeout(() => {
      pushed.current = q
      update({ q }, { replace: true })
      onSearch?.()
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [value, update, onSearch])

  return (
    <div className={cn('relative', className)}>
      <label htmlFor={id} className="sr-only">
        Buscar no catálogo
      </label>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        data-catalog-search
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className={cn('h-10 pl-9', inputClassName)}
      />
    </div>
  )
}

export default SearchField
