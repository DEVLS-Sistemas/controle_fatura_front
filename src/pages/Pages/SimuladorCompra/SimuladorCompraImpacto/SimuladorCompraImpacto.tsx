import React from 'react'
import { Card, CardBody } from 'reactstrap'
import { formatCurrency } from 'helpers/fatura_helpers'
import { SimuladorImpacto } from 'interfaces/SimuladorCompra/SimuladorCompraInterface'

type Props = {
  impacto: SimuladorImpacto | null
  cartaoNome: string
  nParcelas: number
  valorCompra: number
  valorParcela: number
  competenciaLabel: string
  competenciaCurta: string
  responsavelNome: string
  ehEu: boolean
}

const SimuladorCompraImpacto = ({
  impacto,
  cartaoNome,
  nParcelas,
  valorCompra,
  valorParcela,
  competenciaLabel,
  competenciaCurta,
  responsavelNome,
  ehEu,
}: Props) => {
  const parcelaCtx =
    nParcelas <= 1 ? 'à vista' : `parcela 1 de ${nParcelas}`
  const contexto = [cartaoNome, nParcelas > 1 ? `${nParcelas}x` : null, parcelaCtx]
    .filter(Boolean)
    .join('  ·  ')

  const jaDeve = impacto?.geral_responsavel.antes ?? 0
  const passaADever = impacto?.geral_responsavel.depois ?? valorParcela
  const nesteCartao = impacto?.neste_cartao.antes ?? 0
  const outrosCartoes = impacto?.outros_cartoes.antes ?? 0
  const nomeResumo = ehEu
    ? `Você neste mês${competenciaCurta ? `  ·  ${competenciaCurta}` : ''}`
    : `${responsavelNome || 'Responsável'}${competenciaCurta ? `  ·  ${competenciaCurta}` : ''}`

  return (
    <>
      <Card className="mb-3 border-0 shadow-sm">
        <CardBody className="p-4 p-md-5">
          <div
            className="text-uppercase text-muted fw-semibold mb-2"
            style={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}
          >
            Simulação de compra
          </div>
          <p className="text-muted mb-4 fs-14">{contexto}</p>

          <div className="text-muted fs-13 mb-1">Esta fatura</div>
          <div className="fw-semibold mb-4" style={{ fontSize: '1.35rem' }}>
            {competenciaLabel || '—'}
          </div>

          <div className="text-muted fs-13 mb-1">Entra nesta fatura</div>
          <div
            className="fw-bold text-primary mb-2"
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 4rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
            }}
          >
            {formatCurrency(valorParcela)}
          </div>
          {valorCompra > 0 && (
            <p className="text-muted mb-0 fs-13">
              {formatCurrency(valorCompra)} {nParcelas > 1 ? `em ${nParcelas}x` : 'à vista'}
              {cartaoNome ? ' neste cartão' : ''}
            </p>
          )}
        </CardBody>
      </Card>

      <Card className="mb-3">
        <CardBody className="p-4">
          <h6 className="mb-3">{nomeResumo}</h6>

          <div className="d-flex justify-content-between align-items-baseline mb-2">
            <span className="text-muted">Já deve neste mês</span>
            <span className="fs-15">{formatCurrency(jaDeve)}</span>
          </div>
          <div className="d-flex justify-content-between align-items-baseline mb-3">
            <span className="text-muted">+ Esta parcela</span>
            <span className="fs-15 text-primary fw-semibold">{formatCurrency(valorParcela)}</span>
          </div>
          <hr className="my-3" />
          <div className="d-flex justify-content-between align-items-baseline">
            <span className="fw-semibold">Passa a dever</span>
            <span
              className="fw-bold"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 2.15rem)', lineHeight: 1.1 }}
            >
              {formatCurrency(passaADever)}
            </span>
          </div>
          {outrosCartoes > 0 && (
            <p className="text-muted fs-12 mb-0 mt-3">
              Neste cartão {formatCurrency(nesteCartao)}
              {'  ·  '}
              Outros cartões {formatCurrency(outrosCartoes)}
            </p>
          )}
        </CardBody>
      </Card>
    </>
  )
}

export default SimuladorCompraImpacto
