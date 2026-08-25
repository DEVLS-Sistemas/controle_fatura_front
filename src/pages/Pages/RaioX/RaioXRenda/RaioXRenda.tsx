import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input, Label, Spinner } from 'reactstrap'
import { mask } from 'helpers/functions_helpers'
import { formatRendaPayload } from 'helpers/raio_x_helpers'

type Props = {
  informada: boolean
  saving?: boolean
  onSave: (rendaBr: string) => Promise<void> | void
}

const RaioXRenda = ({ informada, saving = false, onSave }: Props) => {
  const [valor, setValor] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (informada) {
    return (
      <p className="text-muted fs-13 mb-0 mt-2">
        <Link to="/pages-profile-settings" className="link-secondary">
          Alterar renda
        </Link>
      </p>
    )
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValor(mask('preco', event.target.value) || '')
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving) return
    const payload = formatRendaPayload(valor)
    if (!payload) {
      setError('Informe um valor maior que zero.')
      return
    }
    await onSave(payload)
  }

  return (
    <div className="border rounded-3 p-3 p-md-4 mt-2 bg-body-tertiary">
      <form onSubmit={handleSubmit}>
        <Label htmlFor="raio-x-renda" className="form-label mb-2">
          Qual é a sua renda mensal?
        </Label>
        <div className="d-flex flex-column flex-sm-row gap-2">
          <div className="input-group" style={{ maxWidth: 260 }}>
            <span className="input-group-text">R$</span>
            <Input
              id="raio-x-renda"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={valor}
              onChange={handleChange}
              disabled={saving}
              invalid={Boolean(error)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Spinner size="sm" className="me-1" /> : null}
            Salvar
          </button>
        </div>
        {error ? <div className="text-danger fs-13 mt-2">{error}</div> : null}
        <p className="text-muted fs-13 mb-0 mt-2">
          Usamos só para calcular o comprometimento das faturas. Você pode alterar no Perfil.
        </p>
      </form>
    </div>
  )
}

export default RaioXRenda
