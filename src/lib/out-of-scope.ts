import { toast } from 'sonner'

// links e ações que o desafio deixa de fora avisam, em vez de parecerem funcionar
export const outOfScope = () => toast.info('Esta função não faz parte desta demonstração.')
