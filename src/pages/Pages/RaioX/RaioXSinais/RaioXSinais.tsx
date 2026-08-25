import React from 'react'
import { useNavigate } from 'react-router-dom'
import { RaioXSinal } from 'interfaces/RaioX/RaioXInterface'
import { atalhoToPath, nivelUi } from 'helpers/raio_x_helpers'

type Props = {
  sinais: RaioXSinal[]
  labelCurto?: string
  label?: string
}

const RaioXSinais = ({ sinais, labelCurto, label }: Props) => {
  const navigate = useNavigate()

  const open = (sinal: RaioXSinal) => {
    const path = atalhoToPath(sinal.atalho)
    if (path) navigate(path)
  }

  return (
    <section className="mb-2">
      <p
        className="text-uppercase fw-semibold text-muted mb-1"
        style={{ letterSpacing: '0.08em', fontSize: '0.78rem' }}
      >
        {labelCurto || 'Seu mês'}
      </p>
      {label && <p className="text-muted fs-13 mb-4">{label}</p>}

      <ul className="list-unstyled mb-0">
        {sinais.map((sinal) => {
          const ui = nivelUi(sinal.nivel)
          const path = atalhoToPath(sinal.atalho)
          return (
            <li key={sinal.id} className="mb-4">
              <button
                type="button"
                className="btn btn-link text-decoration-none text-start p-0 w-100"
                onClick={() => open(sinal)}
                disabled={!path}
                aria-label={`${ui.sr}: ${sinal.frase}`}
              >
                <div className="d-flex align-items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="flex-shrink-0"
                    style={{ fontSize: '1.55rem', lineHeight: 1.2 }}
                  >
                    {ui.emoji}
                  </span>
                  <div className="overflow-hidden">
                    <div
                      className="text-body"
                      style={{
                        fontSize: 'clamp(1.15rem, 2.6vw, 1.45rem)',
                        lineHeight: 1.35,
                        fontWeight: 600,
                      }}
                    >
                      {sinal.frase}
                    </div>
                    {sinal.contexto ? (
                      <div className="text-muted fs-13 mt-1 text-truncate" title={sinal.contexto}>
                        {sinal.contexto}
                      </div>
                    ) : null}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export const RaioXSinaisSkeleton = () => (
  <section className="mb-2">
    <div className="placeholder-glow">
      <span className="placeholder col-3 mb-4 d-block" style={{ height: 14 }} />
      {[0, 1, 2].map((i) => (
        <div key={i} className="d-flex align-items-center gap-3 mb-4">
          <span className="placeholder rounded-circle d-inline-block" style={{ width: 28, height: 28 }} />
          <span className="placeholder col-8" style={{ height: 22 }} />
        </div>
      ))}
    </div>
  </section>
)

export default RaioXSinais
