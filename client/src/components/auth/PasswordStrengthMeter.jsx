import { FiCheck, FiX } from 'react-icons/fi'
import { checkPasswordStrength } from '../../utils/validators'

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null
  const { checks, score } = checkPasswordStrength(password)

  const barColor = score <= 2 ? 'bg-red-500' : score <= 4 ? 'bg-kc-500' : 'bg-forest-500'

  return (
    <div className="mt-2">
      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-navy-600 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300 ease-smooth`}
          style={{ width: `${(score / checks.length) * 100}%` }}
        />
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-1">
        {checks.map((c) => (
          <li
            key={c.label}
            className={`flex items-center gap-1.5 text-xs ${
              c.valid ? 'text-forest-600 dark:text-forest-400' : 'text-slate-400'
            }`}
          >
            {c.valid ? <FiCheck size={12} /> : <FiX size={12} />}
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
