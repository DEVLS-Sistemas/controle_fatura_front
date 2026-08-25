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
  podeConfirmarAssinatura,
  statusAssinaturaBadge,
  subtittleMaquininha,
} from 'helpers/assinaturas_helpers'
import AssinaturasAcoes from '../AssinaturasAcoes/AssinaturasAcoes'

type AssinaturaCardVariant = 'oficial' | 'candidata' | 'ignorada'

interface AssinaturasListProps {
  oficiais?: AssinaturaItem[]
  candidatas?: AssinaturaItem[]
  ignoradas?: AssinaturaItem[]
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

const AssinaturaCard = ({
  item,
  variant,
  acting,
  onAcao,
  onOpen,
}: {
  item: AssinaturaItem
  variant: AssinaturaCardVariant
  acting?: boolean
  onAcao: (identificador: string, acao: AssinaturaAcao) => void
  onOpen: (identificador: string) => void
}) => {
  const badge = statusAssinaturaBadge(item.status, item.status_label)
  const maquininha = subtittleMaquininha(item)
  const tooltipId = `periodicidade-assumida-${item.identificador}`.replace(/[^a-zA-Z0-9_-]/g, '-')
  const sugestao = variant === 'candidata' || podeConfirmarAssinatura(item)

  return (
    <Card
      className={`mb-3 card-animate ${sugestao ? 'border-warning border-opacity-50' : ''}`}
      role="button"
      tabIndex={0}
      title="Ver cobranças"
      onClick={() => onOpen(item.identificador)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(item.identificador)
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <CardBody>
        {sugestao ? (
          <div className="text-warning fw-semibold fs-12 text-uppercase mb-2">
            <i className="ri-lightbulb-line me-1"></i>
            Sugestão do sistema
          </div>
        ) : null}
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
                  {sugestao ? 'Possível assinatura' : badge.label}
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
              {item.proxima_estimada && variant === 'oficial' ? (
                <span>Próxima (est.): {formatDateBr(item.proxima_estimada)}</span>
              ) : null}
              {item.cobrancas != null ? (
                <span>
                  {item.cobrancas} {item.cobrancas === 1 ? 'cobrança' : 'cobranças'}
                </span>
              ) : null}
              {item.confianca_label && sugestao ? (
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

            <AssinaturasAcoes item={item} acting={acting} onAcao={onAcao} />
          </div>
          <div className="flex-shrink-0 align-self-center text-muted d-none d-md-block">
            <i className="ri-arrow-right-s-line fs-22" aria-hidden="true"></i>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

const AssinaturasList = ({
  oficiais = [],
  candidatas = [],
  ignoradas = [],
  loading,
  error,
  statusFiltro,
  actingId,
  onAcao,
  onRetry,
}: AssinaturasListProps) => {
  const navigate = useNavigate()
  const verIgnoradas = statusFiltro === 'ignorada'

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

  if (verIgnoradas) {
    if (ignoradas.length === 0) {
      const empty = emptyAssinaturasMessage('ignorada')
      return (
        <Card>
          <CardBody className="text-center py-5">
            <div className="avatar-md mx-auto mb-3">
              <span className="avatar-title bg-light text-muted rounded-circle fs-24">
                <i className="ri-eye-off-line"></i>
              </span>
            </div>
            <h5 className="mb-1">{empty.title}</h5>
            <p className="text-muted mb-0">{empty.text}</p>
          </CardBody>
        </Card>
      )
    }

    return (
      <section>
        <h5 className="mb-3">Ignoradas</h5>
        {ignoradas.map((item) => (
          <AssinaturaCard
            key={item.identificador}
            item={item}
            variant="ignorada"
            acting={actingId === item.identificador}
            onAcao={onAcao}
            onOpen={openDetalhe}
          />
        ))}
      </section>
    )
  }

  const emptyOficial = emptyAssinaturasMessage('confirmada')

  return (
    <React.Fragment>
      {candidatas.length > 0 ? (
        <section id="assinaturas-para-confirmar" className="mb-4">
          <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
            <div>
              <h5 className="mb-1">Para confirmar</h5>
              <p className="text-muted mb-0 fs-13">
                O sistema encontrou cobranças recorrentes. Confirme para entrar na lista de assinaturas.
              </p>
            </div>
            <Badge color="warning" pill className="flex-shrink-0">
              {candidatas.length}
            </Badge>
          </div>
          {candidatas.map((item) => (
            <AssinaturaCard
              key={item.identificador}
              item={item}
              variant="candidata"
              acting={actingId === item.identificador}
              onAcao={onAcao}
              onOpen={openDetalhe}
            />
          ))}
        </section>
      ) : null}

      <section id="minhas-assinaturas">
        <h5 className="mb-3">Minhas assinaturas</h5>
        {oficiais.length === 0 ? (
          <Card>
            <CardBody className="text-center py-5">
              <div className="avatar-md mx-auto mb-3">
                <span className="avatar-title bg-light text-muted rounded-circle fs-24">
                  <i className="ri-refresh-line"></i>
                </span>
              </div>
              <h5 className="mb-1">{emptyOficial.title}</h5>
              <p className="text-muted mb-0">{emptyOficial.text}</p>
            </CardBody>
          </Card>
        ) : (
          oficiais.map((item) => (
            <AssinaturaCard
              key={item.identificador}
              item={item}
              variant="oficial"
              acting={actingId === item.identificador}
              onAcao={onAcao}
              onOpen={openDetalhe}
            />
          ))
        )}
      </section>
    </React.Fragment>
  )
}

export default AssinaturasList
