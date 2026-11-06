const day = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' })

export const formatDay = (iso: string) => day.format(new Date(iso))
