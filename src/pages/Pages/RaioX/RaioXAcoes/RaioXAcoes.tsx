import React from 'react'
import { Link } from 'react-router-dom'
import { RaioXAcao } from 'interfaces/RaioX/RaioXInterface'
import { atalhoToPath } from 'helpers/raio_x_helpers'

type Props = {
  acoes: RaioXAcao[]
}

const RaioXAcoes = ({ acoes }: Props) => {
  const items = (acoes || []).filter((acao) => atalhoToPath(acao.atalho))
  if (items.length === 0) return null

  return (
    <nav className="pt-4 pt-md-5 mt-3 mt-md-4 border-top" aria-label="Atalhos do Raio-X">
      <div className="d-flex flex-wrap gap-2">
        {items.map((acao) => {
          const path = atalhoToPath(acao.atalho)
          if (!path) return null
          return (
            <Link key={acao.id} to={path} className="btn btn-soft-secondary btn-sm">
              {acao.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default RaioXAcoes
