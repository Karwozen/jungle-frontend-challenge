// a busca do catálogo existe em duas versões e só uma fica visível por vez
export function focusCatalogSearch() {
  const fields = document.querySelectorAll<HTMLInputElement>('input[data-catalog-search]')
  const visible = Array.from(fields).find((field) => field.offsetParent !== null)
  visible?.focus()
}
