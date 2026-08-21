import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Card, CardBody, CardHeader, Table } from 'reactstrap'
import { CurrencyValue } from 'Components/Common/CurrencyValue'
import {
  deveMostrarRepasse,
  faturaDestinoParcela,
  statusParcelaColor,
  temColunaRepasse,
} from 'helpers/compra_visualizacao_helpers'
import { faturaStatusColor, formatCurrency, formatDateBr, statusRepasseColor } from 'helpers/fatura_helpers'
import {
  CompraParcelaItem,
  CompraVisualizacaoView,
} from 'interfaces/CompraVisualizacao/CompraVisualizacaoInterface'

interface CompraVisualizacaoParcelasProps {
  compra: CompraVisualizacaoView
}

const parcelaLabel = (parcela: CompraParcelaItem): string =>
  `${parcela.parcela_atual}/${parcela.parcelas_total}`

const RepasseCell = ({
  parcela,
  compra,
}: {
  parcela: CompraParcelaItem
  compra: CompraVisualizacaoView
}) => {
  if (!deveMostrarRepasse(parcela, compra) || !parcela.repasse) {
    return <span className="text-muted">—</span>
  }

  const status = parcela.repasse.status_repasse
  const label = parcela.repasse.status_repasse_label || status || '—'

  return (
    <div className="d-flex flex-column gap-1">
      <Badge color={statusRepasseColor[status || ''] ?? 'secondary'} pill>
        {label}
      </Badge>
      {parcela.repasse.valor_pago != null ? (
        <span className="fs-12 text-muted">
          Pago {formatCurrency(parcela.repasse.valor_pago)}
        </span>
      ) : null}
    </div>
  )
}

const ParcelaCard = ({
  parcela,
  compra,
  showRepasse,
  onOpen,
}: {
  parcela: CompraParcelaItem
  compra: CompraVisualizacaoView
  showRepasse: boolean
  onOpen: () => void
}) => {
  const atual = parcela.status_parcela === 'atual'
  const destino = faturaDestinoParcela(parcela)

  return (
    <Card
      className={`mb-2 ${atual ? 'border-info' : ''} ${destino ? 'card-animate' : ''}`}
      role={destino ? 'button' : undefined}
      onClick={destino ? onOpen : undefined}
      style={destino ? { cursor: 'pointer' } : undefined}
    >
      <CardBody className="py-3">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <div>
            <span className="fw-semibold">Parcela {parcelaLabel(parcela)}</span>
            <div className="text-muted fs-12">{parcela.fatura_label || '—'}</div>
          </div>
          <Badge color={statusParcelaColor(parcela.status_parcela)} pill>
            {parcela.status_parcela_label || parcela.status_parcela || '—'}
          </Badge>
        </div>
        <div className="d-flex flex-wrap justify-content-between gap-2 fs-13">
          <CurrencyValue value={parcela.valor} className="fw-semibold" />
          <span className="text-muted">
            {parcela.fatura_status_label || parcela.fatura_status || '—'}
          </span>
        </div>
        {showRepasse ? (
          <div className="mt-2">
            <RepasseCell parcela={parcela} compra={compra} />
          </div>
        ) : null}
      </CardBody>
    </Card>
  )
}

const CompraVisualizacaoParcelas = ({ compra }: CompraVisualizacaoParcelasProps) => {
  const navigate = useNavigate()
  const parcelas = compra.parcelas ?? []
  const showRepasse = temColunaRepasse(compra)

  const handleOpen = (parcela: CompraParcelaItem) => {
    const to = faturaDestinoParcela(parcela)
    if (to) navigate(to)
  }

  return (
    <Card>
      <CardHeader>
        <h5 className="card-title mb-0">Parcelas</h5>
      </CardHeader>
      <CardBody>
        <div className="d-none d-md-block table-responsive">
          <Table className="align-middle mb-0" hover>
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Competência</th>
                <th className="text-end">Valor</th>
                <th>Status</th>
                <th>Fatura</th>
                {showRepasse ? <th>Repasse</th> : null}
              </tr>
            </thead>
            <tbody>
              {parcelas.map((parcela) => {
                const atual = parcela.status_parcela === 'atual'
                const destino = faturaDestinoParcela(parcela)
                return (
                  <tr
                    key={parcela.id}
                    className={atual ? 'compra-parcela-row--atual' : undefined}
                    role={destino ? 'button' : undefined}
                    onClick={destino ? () => handleOpen(parcela) : undefined}
                    style={destino ? { cursor: 'pointer' } : undefined}
                    title={destino ? 'Abrir fatura' : undefined}
                  >
                    <td className="fw-semibold">{parcelaLabel(parcela)}</td>
                    <td>
                      <div>{parcela.fatura_label || '—'}</div>
                      {parcela.data ? (
                        <div className="text-muted fs-12">{formatDateBr(parcela.data)}</div>
                      ) : null}
                    </td>
                    <td className="text-end">
                      <CurrencyValue value={parcela.valor} />
                    </td>
                    <td>
                      <Badge color={statusParcelaColor(parcela.status_parcela)} pill>
                        {parcela.status_parcela_label || parcela.status_parcela || '—'}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        color={faturaStatusColor[parcela.fatura_status || ''] ?? 'secondary'}
                        className="text-capitalize"
                      >
                        {parcela.fatura_status_label || parcela.fatura_status || '—'}
                      </Badge>
                    </td>
                    {showRepasse ? (
                      <td>
                        <RepasseCell parcela={parcela} compra={compra} />
                      </td>
                    ) : null}
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>

        <div className="d-md-none">
          {parcelas.map((parcela) => (
            <ParcelaCard
              key={parcela.id}
              parcela={parcela}
              compra={compra}
              showRepasse={showRepasse}
              onOpen={() => handleOpen(parcela)}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

export default CompraVisualizacaoParcelas
