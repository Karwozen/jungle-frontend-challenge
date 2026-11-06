import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false)
  return <div className="password-input"><input {...props} type={visible ? 'text' : 'password'}/><button type="button" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={visible} onClick={() => setVisible(value => !value)}>{visible ? <Eye size={18}/> : <EyeOff size={18}/>}</button></div>
}
