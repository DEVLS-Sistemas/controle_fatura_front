import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Card, CardBody, UncontrolledTooltip } from 'reactstrap'
import { CurrencyValue } from 'Components/Common/CurrencyValue'
import { formatCurrency, formatDateBr } from 'helpers/fatura_helpers'
import {
  AssinaturaAcao,
  AssinaturaItem,
} from 'interfaces/Assinaturas/AssinaturasInterface'
import {
  emptyAssinaturasMessage,
  statusAssinaturaBadge,
  subtittleMaquininha,
} from 'helpers/assinaturas_helpers'
import AssinaturasAcoes from '../AssinaturasAcoes/AssinaturasAcoes'

interface AssinaturasListProps {
  itens?: AssinaturaItem[]
  loading?: boolean
  error?: boolean
  statusFiltro?: string | null
  actingId?: string | null
  onAcao: (identificador: string, acao: AssinaturaAcao) => void
  onRetry?: () => void
}

const AssinaturasListSkeleton = () => (
  <>
    {[1, 2, 3].map((i) => (
      <Card key={i} className="mb-3">
        <CardBody>
          <div className="placeholder-glow">
            <span className="placeholder col-4 mb-2"></span>
            <span className="placeholder col-12 mb-2"></span>
            <span className="placeholder col-10"></span>
          </div>
        </CardBody>
      </Card>
    ))}
  </>
)

const AssinaturasList = ({
  itens = [],
  loading,
  error,
  statusFiltro,
  actingId,
  onAcao,
  onRetry,
}: AssinaturasListProps) => {
  const navigate = useNavigate()

  const openDetalhe = (identificador: string) => {
    navigate(`/assinaturas/${encodeURIComponent(identificador)}`)
  }

  if (loading) {
    return <AssinaturasListSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardBody className="text-center py-5">
          <div className="avatar-md mx-auto mb-3">
            <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-24">
              <i className="ri-error-warning-line"></i>
            </span>
          </div>
          <h5 className="mb-1">Não foi possível carregar as assinaturas</h5>
          <p className="text-muted mb-3">Tente novamente em instantes.</p>
          {onRetry ? (
            <button type="button" className="btn btn-soft-primary" onClick={onRetry}>
              Tentar novamente
            </button>
          ) : null}
        </CardBody>
      </Card>
    )
  }

  if (itens.length === 0) {
    const empty = emptyAssinaturasMessage(statusFiltro)
    return (
      <Card>
        <CardBody className="text-center py-5">
          <div className="avatar-md mx-auto mb-3">
            <span className="avatar-title bg-light text-muted rounded-circle fs-24">
              <i className="ri-refresh-line"></i>
            </span>
          </div>
          <h5 className="mb-1">{empty.title}</h5>
          <p className="text-muted mb-0">{empty.text}</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <React.Fragment>
      {itens.map((item) => {
        const badge = statusAssinaturaBadge(item.status, item.status_label)
        const maquininha = subtittleMaquininha(item)
        const tooltipId = `periodicidade-assumida-${item.identificador}`.replace(/[^a-zA-Z0-9_-]/g, '-')
        const pendentes = Number(item.cobrancas_pendentes ?? 0)
        const showPendentes = pendentes > 0 && item.status === 'candidata'

        return (
          <Card
            key={item.identificador}
            className="mb-3 card-animate"
            role="button"
            tabIndex={0}
            title="Ver cobranças"
            onClick={() => openDetalhe(item.identificador)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openDetalhe(item.identificador)
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <CardBody>
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                <div style={{ minWidth: 0 }} className="flex-grow-1">
                  <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-1">
                    <div style={{ minWidth: 0 }}>
                      <h5 className="mb-1 text-truncate">{item.titulo || 'Assinatura'}</h5>
                      {maquininha ? (
                        <p className="text-muted mb-0 fs-13">{maquininha}</p>
                      ) : null}
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                      {item.periodicidade_label ? (
                        <Badge
                          color="info"
                          pill
                          id={item.periodicidade_assumida ? tooltipId : undefined}
                        >
                          {item.periodicidade_label}
                          {item.periodicidade_assumida ? (
                            <i className="ri-information-line ms-1"></i>
                          ) : null}
                        </Badge>
                      ) : null}
                      <Badge color={badge.color} pill>
                        {badge.label}
                      </Badge>
                    </div>
                  </div>

                  {item.periodicidade_assumida ? (
                    <UncontrolledTooltip placement="top" target={tooltipId}>
                      Assumimos mensal porque só há 1 cobrança já marcada como serviço
                    </UncontrolledTooltip>
                  ) : null}

                  <div className="d-flex flex-wrap align-items-baseline gap-2 mb-2">
                    <span className="fw-semibold fs-16">
                      <CurrencyValue value={item.estimativa_anual} />
                      <span className="text-muted fs-13 fw-normal">/ano</span>
                    </span>
                    <span className="text-muted">·</span>
                    <span className="text-muted fs-13">
                      {formatCurrency(item.valor_medio)}/cobrança
                    </span>
                  </div>

                  <div className="d-flex flex-wrap align-items-center gap-2 fs-12 text-muted mb-2">
                    {item.ultima_cobranca ? (
                      <span>Última: {formatDateBr(item.ultima_cobranca)}</span>
                    ) : null}
                    {item.proxima_estimada ? (
                      <span>Próxima (est.): {formatDateBr(item.proxima_estimada)}</span>
                    ) : null}
                    {item.cobrancas != null ? (
                      <span>
                        {item.cobrancas} {item.cobrancas === 1 ? 'cobrança' : 'cobranças'}
                      </span>
                    ) : null}
                    {showPendentes ? (
                      <Badge color="warning" className="text-dark">
                        {pendentes} ainda sem origem de serviço
                      </Badge>
                    ) : null}
                    {item.confianca_label ? (
                      <span className="ms-auto">Confiança {item.confianca_label.toLowerCase()}</span>
                    ) : null}
                    {item.categoria_nome ? (
                      <Badge
                        color="light"
                        className="text-body"
                        style={item.categoria_cor ? { borderLeft: `3px solid ${item.categoria_cor}` } : undefined}
                      >
                        {item.categoria_nome}
                      </Badge>
                    ) : null}
                  </div>

                  <AssinaturasAcoes
                    item={item}
                    acting={actingId === item.identificador}
                    onAcao={onAcao}
                    onVerCobrancas={openDetalhe}
                  />
                </div>
                <div className="flex-shrink-0 align-self-center text-muted d-none d-md-block">
                  <i className="ri-arrow-right-s-line fs-22" aria-hidden="true"></i>
                </div>
              </div>
            </CardBody>
          </Card>
        )
      })}
    </React.Fragment>
  )
}

export default AssinaturasList
