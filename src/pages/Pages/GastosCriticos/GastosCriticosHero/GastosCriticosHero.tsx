import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardBody, Col, Row } from 'reactstrap'
import { CurrencyValue } from 'Components/Common/CurrencyValue'
import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import {
  atalhoToPath,
  atalhoToPeriodoState,
  formatPercentualApi,
  formatVariacao,
  destaqueDiagnostico,
} from 'helpers/gastos_criticos_helpers'
import {
  GastosCriticosDestaque,
  GastosCriticosPeriodoAnterior,
  GastosCriticosTotais,
  GastosCriticosView,
} from 'interfaces/GastosCriticos/GastosCriticosInterface'

interface GastosCriticosHeroProps {
  data?: GastosCriticosView
  loading?: boolean
}

const DestaqueSkeleton = () => (
  <Col xl={6} md={6}>
    <Card className="mb-0">
      <CardBody>
        <div className="placeholder-glow">
          <span className="placeholder col-5 mb-2"></span>
          <span className="placeholder col-8 mb-2"></span>
          <span className="placeholder col-12"></span>
        </div>
      </CardBody>
    </Card>
  </Col>
)

const abrirAtalho = (
  navigate: ReturnType<typeof useNavigate>,
  destaque?: GastosCriticosDestaque | null
) => {
  const path = atalhoToPath(destaque?.atalho)
  if (!path) return
  navigate(path, { state: atalhoToPeriodoState(destaque?.atalho) })
}

const DestaqueCard = ({
  titulo,
  icone,
  cor,
  destaque,
  enfatizarValor,
}: {
  titulo: string
  icone: string
  cor: string
  destaque: GastosCriticosDestaque
  enfatizarValor: boolean
}) => {
  const navigate = useNavigate()
  const path = atalhoToPath(destaque.atalho)
  const nome = destaque.nome_exibicao || destaque.nome
  const percentual = formatPercentualApi(destaque.percentual_gasto)
  const frequencia = destaque.frequencia?.label

  return (
    <Col xl={6} md={6}>
      <Card
        className={`card-animate mb-0 h-100 border-${cor} border-opacity-25`}
        role={path ? 'button' : undefined}
        tabIndex={path ? 0 : undefined}
        title={path ? 'Ver detalhes' : undefined}
        onClick={() => abrirAtalho(navigate, destaque)}
        onKeyDown={(e) => {
          if (path && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            abrirAtalho(navigate, destaque)
          }
        }}
        style={path ? { cursor: 'pointer' } : undefined}
      >
        <CardBody>
          <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
            <div>
              <p className="text-uppercase fw-medium text-muted mb-1">{titulo}</p>
              <h4 className="mb-1">{nome || '—'}</h4>
            </div>
            <div className="avatar-sm flex-shrink-0">
              <span className={`avatar-title bg-${cor}-subtle text-${cor} rounded fs-3`}>
                <i className={icone}></i>
              </span>
            </div>
          </div>

          {enfatizarValor ? (
            <>
              <h3 className={`fs-22 fw-semibold ff-secondary mb-1 ${VALOR_TEXT_CLASS}`}>
                {formatCurrency(destaque.valor_total)}
              </h3>
              {percentual ? (
                <p className="text-muted mb-2 fs-13">{percentual} do total</p>
              ) : null}
            </>
          ) : (
            <>
              <h3 className="fs-22 fw-semibold ff-secondary mb-1">
                {destaque.compras ?? 0} {Number(destaque.compras) === 1 ? 'compra' : 'compras'}
              </h3>
              {frequencia ? <p className="text-muted mb-2 fs-13">{frequencia}</p> : null}
            </>
          )}

          {destaque.frase ? <p className="mb-1 fw-medium">{destaque.frase}</p> : null}
          {destaque.contexto ? <p className="text-muted mb-0 fs-13">{destaque.contexto}</p> : null}
        </CardBody>
      </Card>
    </Col>
  )
}

const VariacaoFaixa = ({
  totais,
  periodoAnterior,
}: {
  totais?: GastosCriticosTotais | null
  periodoAnterior?: GastosCriticosPeriodoAnterior | null
}) => {
  const variacao = formatVariacao(totais?.variacao_valor_percentual)
  if (totais?.variacao_valor_percentual == null) return null

  return (
    <div className={`alert alert-${variacao.color} alert-border-left mb-3 py-2`} role="status">
      <div className="d-flex flex-wrap align-items-center gap-2">
        <i
          className={`ri-arrow-${variacao.sinal === 'down' ? 'down' : 'up'}-line align-middle`}
        ></i>
        <span>
          Gasto {variacao.label} vs {periodoAnterior?.label || 'período anterior'}
          {totais.valor_anterior != null ? (
            <>
              {' '}
              (<CurrencyValue value={totais.valor_anterior} />)
            </>
          ) : null}
        </span>
      </div>
    </div>
  )
}

const GastosCriticosHero = ({ data, loading }: GastosCriticosHeroProps) => {
  if (loading && !data) {
    return (
      <Row className="g-3 mb-3">
        <DestaqueSkeleton />
        <DestaqueSkeleton />
      </Row>
    )
  }

  const maiorGasto = destaqueDiagnostico(data?.destaques?.maior_gasto)
  const maisComprado = destaqueDiagnostico(data?.destaques?.mais_comprado)
  const temVariacao = data?.totais?.variacao_valor_percentual != null
  if (!maiorGasto && !maisComprado && !temVariacao) return null

  return (
    <React.Fragment>
      <VariacaoFaixa totais={data?.totais} periodoAnterior={data?.periodo_anterior} />
      <Row className="g-3 mb-3">
        {maiorGasto ? (
          <DestaqueCard
            titulo="O que mais gasta"
            icone="ri-money-dollar-circle-line"
            cor="danger"
            destaque={maiorGasto}
            enfatizarValor
          />
        ) : null}
        {maisComprado ? (
          <DestaqueCard
            titulo="O que mais compra"
            icone="ri-repeat-line"
            cor="info"
            destaque={maisComprado}
            enfatizarValor={false}
          />
        ) : null}
      </Row>
    </React.Fragment>
  )
}

export default GastosCriticosHero
