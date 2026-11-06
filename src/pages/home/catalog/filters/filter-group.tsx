import { Checkbox } from '@/components/ui/checkbox'

interface FilterGroupProps<T extends string> {
  title: string
  options: Record<T, string>
  counts?: Record<T, number>
  selected: T[] | undefined
  onChange: (next: T[] | undefined) => void
}

function FilterGroup<T extends string>({ title, options, counts, selected = [], onChange }: FilterGroupProps<T>) {
  const toggle = (key: T, checked: boolean) => {
    const next = checked ? [...selected, key] : selected.filter((k) => k !== key)
    onChange(next.length ? next : undefined)
  }

  return (
    <fieldset className="mt-8 first:mt-0">
      <legend className="text-sm font-bold">{title}</legend>
      <ul className="mt-3 space-y-1">
        {(Object.keys(options) as T[]).map((key) => (
          <li key={key}>
            <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-xs has-data-checked:text-text-accent hover:text-text-accent">
              <Checkbox checked={selected.includes(key)} onCheckedChange={(checked) => toggle(key, checked === true)} />
              <span className="flex-1">{options[key]}</span>
              {counts && <span>({counts[key]})</span>}
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  )
}

export default FilterGroup
