import { useState } from 'react';

export default function CopyButton({ value, label = 'Copiar', className = '' }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Copiá el valor:', value);
    }
  }

  return (
    <button type="button" className={`btn btn-ghost btn-sm ${className}`} onClick={copy}>
      {copied ? 'Copiado ✓' : label}
    </button>
  );
}
