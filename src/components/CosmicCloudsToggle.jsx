import { useState } from 'react'
import './CosmicCloudsToggle.css'

export default function CosmicCloudsToggle({ checked, onChange }) {
  const [internalChecked, setInternalChecked] = useState(false)
  const isControlled = checked !== undefined
  const isChecked = isControlled ? checked : internalChecked

  const handleToggle = () => {
    const next = !isChecked
    if (!isControlled) {
      setInternalChecked(next)
    }
    if (onChange) {
      onChange(next)
    }
  }

  return (
    <button
      className="toggle"
      role="switch"
      aria-checked={isChecked ? 'true' : 'false'}
      aria-label="Cosmic Clouds"
      onClick={handleToggle}
    >
      <span className="knob"></span>
    </button>
  )
}