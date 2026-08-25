import React from 'react'
import { Card, CardBody } from 'reactstrap'
import { formatCurrency } from 'helpers/fatura_helpers'
import { formatPctVeredito, formatTotalCurto } from 'helpers/posso_comprar_helpers'
import { SimuladorVeredito, SimuladorVereditoNivel, SimuladorVereditoScore } from 'interfaces/SimuladorCompra/SimuladorCompraInterface'

type Props = {
  veredito: SimuladorVeredito
  valorParcela: number
  competenciaLabel: string
}

const TONE: Record<
  SimuladorVereditoNivel,
  { card: string; title: string; icon: string; sr: string }
> = {
  baixo: {
    card: 'bg-success-subtle border border-success',
    title: 'text-success',
    icon: 'ri-checkbox-circle-fill',
    sr: 'Verde. Baixo impacto.',
  },
  moderado: {
    card: 'bg-warning-subtle border border-warning',
    title: 'text-warning-emphasis',
    icon: 'ri-error-warning-fill',
    sr: 'Âmbar. Impacto moderado.',
  },
  alto: {
    card: 'bg-danger-subtle border border-danger',
    title: 'text-danger',
    icon: 'ri-close-circle-fill',
    sr: 'Vermelho. Compra compromete demais os próximos meses.',
  },
}

const MES_TONE: Record<SimuladorVereditoScore, { bg: string; color: string; ring: string }> = {
  0: { bg: 'var(--bs-success-bg-subtle)', color: 'var(--bs-success-text-emphasis)', ring: 'var(--bs-success)' },
  1: { bg: 'var(--bs-warning-bg-subtle)', color: 'var(--bs-warning-text-emphasis)', ring: 'var(--bs-warning)' },
  2: { bg: 'var(--bs-danger-bg-subtle)', color: 'var(--bs-danger-text-emphasis)', ring: 'var(--bs-danger)' },
}

export const SimuladorCompraVereditoSkeleton = () => (
  <Card className="mb-3 border-0 shadow-sm">
    <CardBody className="p-4 p-md-5">
      <div className="placeholder-glow">
        <span className="placeholder rounded-circle d-inline-block mb-3" style={{ width: 28, height: 28 }} />
        <span className="placeholder col-8 mb-3 d-block" style={{ height: 32 }} />
        <span className="placeholder col-4 mb-3 d-block" />
        <span className="placeholder col-10 mb-2 d-block" />
        <span className="placeholder col-7 mb-4 d-block" />
        <div className="d-flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="placeholder rounded" style={{ width: 52, height: 72, flex: '0 0 52px' }} />
          ))}
        </div>
      </div>
    </CardBody>
  </Card>
)

const SimuladorCompraVeredito = ({ veredito, valorParcela, competenciaLabel }: Props) => {
  const tone = TONE[veredito.nivel]

  return (
    <Card className={`mb-3 shadow-sm ${tone.card}`}>
      <CardBody className="p-4 p-md-5">
        <div role="status" aria-live="polite">
          <span className="visually-hidden">{tone.sr}</span>
          <div className="d-flex align-items-start gap-3 mb-2">
            <i
              className={`${tone.icon} ${tone.title} flex-shrink-0`}
              style={{ fontSize: '1.85rem', lineHeight: 1.1 }}
              aria-hidden="true"
            />
            <div className="overflow-hidden">
              <h2
                className={`${tone.title} mb-1`}
                style={{
                  fontSize: 'clamp(1.35rem, 3.4vw, 1.85rem)',
                  lineHeight: 1.2,
                  fontWeight: 700,
                }}
              >
                {veredito.titulo}
              </h2>
              <p className="text-muted mb-0 fs-13">{veredito.eyebrow}</p>
            </div>
          </div>

          <p className="fs-15 mb-3 mt-3" style={{ maxWidth: 42 * 16 }}>
            {veredito.frase}
          </p>

          {veredito.contexto && (
            <p className="text-muted fs-13 mb-3">{veredito.contexto}</p>
          )}

          {veredito.motivos.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mb-4">
              {veredito.motivos.map((motivo) => (
                <span
                  key={motivo.id}
                  className="badge bg-body-tertiary text-body-secondary fw-normal border"
                >
                  {motivo.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {veredito.meses.length > 0 && (
          <div className="mb-4">
            <div
              className="d-flex gap-1 pb-1"
              style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
              role="list"
              aria-label="Percentual do limite nos meses da compra"
            >
              {veredito.meses.map((mes) => {
                const cor = MES_TONE[mes.score]
                const valor =
                  mes.usoDepois != null
                    ? `${formatPctVeredito(mes.usoDepois)}%`
                    : formatTotalCurto(mes.depois)
                const aria = mes.usoDepois != null
                  ? `${mes.label}: ${formatPctVeredito(mes.usoDepois)}% do limite${mes.ehCritico ? ', mês crítico' : ''}`
                  : `${mes.label}: ${formatCurrency(mes.depois)}${mes.ehCritico ? ', mês crítico' : ''}`
                return (
                  <div
                    key={mes.chave}
                    role="listitem"
                    className="text-center flex-shrink-0"
                    style={{
                      minWidth: 52,
                      padding: '8px 6px 6px',
                      borderRadius: 10,
                      background: cor.bg,
                      color: cor.color,
                      boxShadow: mes.ehCritico ? `0 0 0 2px ${cor.ring}` : undefined,
                      fontWeight: mes.ehCritico ? 700 : 500,
                    }}
                    aria-label={aria}
                    aria-current={mes.ehCritico ? 'true' : undefined}
                  >
                    <div className="text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.02em' }}>
                      {mes.labelCurto}
                    </div>
                    <div className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                      {valor}
                    </div>
                    <div aria-hidden="true" style={{ fontSize: 10, lineHeight: 1.2 }}>
                      {mes.ehCritico ? '●' : '·'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="pt-3 border-top border-opacity-25">
          <div className="text-muted fs-13 mb-1">Entra nesta fatura</div>
          <div
            className="fw-bold mb-1"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.15rem)', lineHeight: 1.1, letterSpacing: '-0.02em' }}
          >
            {formatCurrency(valorParcela)}
          </div>
          {competenciaLabel && (
            <p className="text-muted mb-0 fs-13">{competenciaLabel}</p>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

export default SimuladorCompraVeredito
