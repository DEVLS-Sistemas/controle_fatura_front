import React from 'react'
import { useNavigate } from 'react-router-dom'
import { RaioXDiagnostico } from 'interfaces/RaioX/RaioXInterface'
import { atalhoToPath, diagnosticoIcone } from 'helpers/raio_x_helpers'

type Props = {
  diagnostico: RaioXDiagnostico
}

const RaioXDiagnosticoBlock = ({ diagnostico }: Props) => {
  const navigate = useNavigate()
  const path = atalhoToPath(diagnostico.atalho)
  const ok = diagnostico.tipo === 'ok'
  const titleColor = ok ? 'text-success' : 'text-body'

  const open = () => {
    if (path) navigate(path)
  }

  return (
    <section className="pt-4 pt-md-5 mt-2 mt-md-4">
      <button
        type="button"
        className="btn btn-link text-decoration-none text-start p-0 w-100"
        onClick={open}
        disabled={!path}
      >
        <div className="d-flex align-items-start gap-3 mb-3">
          <i
            className={`${diagnosticoIcone(diagnostico.tipo)} ${ok ? 'text-success' : 'text-muted'} flex-shrink-0 mt-1`}
            style={{ fontSize: '1.6rem' }}
            aria-hidden="true"
          />
          <h2
            className={`${titleColor} mb-0`}
            style={{
              fontSize: 'clamp(1.4rem, 3.2vw, 1.85rem)',
              lineHeight: 1.25,
              fontWeight: 700,
            }}
          >
            {diagnostico.titulo}
          </h2>
        </div>
      </button>

      <p
        className="mb-3"
        style={{
          fontSize: 'clamp(1.05rem, 2.2vw, 1.2rem)',
          lineHeight: 1.55,
          maxWidth: '40rem',
        }}
      >
        {diagnostico.frase}
      </p>

      {diagnostico.projecao ? (
        <p
          className="mb-4 text-body-secondary"
          style={{
            fontSize: 'clamp(1.05rem, 2.2vw, 1.2rem)',
            lineHeight: 1.55,
            maxWidth: '40rem',
          }}
        >
          {diagnostico.projecao}
        </p>
      ) : null}

      {path ? (
        <button type="button" className="btn btn-soft-primary btn-sm" onClick={open}>
          Ver detalhes
          <i className="ri-arrow-right-line align-middle ms-1"></i>
        </button>
      ) : null}
    </section>
  )
}

export const RaioXDiagnosticoSkeleton = () => (
  <section className="pt-4 pt-md-5 mt-2 mt-md-4">
    <div className="placeholder-glow">
      <span className="placeholder col-9 mb-4 d-block" style={{ height: 28 }} />
      <span className="placeholder col-12 mb-2 d-block" style={{ height: 18 }} />
      <span className="placeholder col-10 mb-2 d-block" style={{ height: 18 }} />
      <span className="placeholder col-8 d-block" style={{ height: 18 }} />
    </div>
  </section>
)

export default RaioXDiagnosticoBlock
