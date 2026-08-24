import { CheckIcon } from '../icons/icons'

export default function Toast({ message, show }) {
  return (
    <div className={`toast${show ? ' show' : ''}`}>
      <CheckIcon strokeWidth="2.5" />
      <span>{message}</span>
    </div>
  )
}
