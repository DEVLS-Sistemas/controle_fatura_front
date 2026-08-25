import React from 'react'
import { Card, CardBody } from 'reactstrap'
import { formatCurrency } from 'helpers/fatura_helpers'
import { SimuladorImpacto } from 'interfaces/SimuladorCompra/SimuladorCompraInterface'

type Props = {
  impacto: SimuladorImpacto | null
  valorParcela: number
  competenciaCurta: string
  responsavelNome: string
  ehEu: boolean
}

const SimuladorCompraImpacto = ({
  impacto,
  valorParcela,
  competenciaCurta,
  responsavelNome,
  ehEu,
}: Props) => {
  const jaDeve = impacto?.geral_responsavel.antes ?? 0
  const passaADever = impacto?.geral_responsavel.depois ?? valorParcela
  const nesteCartao = impacto?.neste_cartao.antes ?? 0
  const outrosCartoes = impacto?.outros_cartoes.antes ?? 0
  const nomeResumo = ehEu
    ? `Você neste mês${competenciaCurta ? `  ·  ${competenciaCurta}` : ''}`
    : `${responsavelNome || 'Responsável'}${competenciaCurta ? `  ·  ${competenciaCurta}` : ''}`

  return (
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
  )
}

export default SimuladorCompraImpacto
