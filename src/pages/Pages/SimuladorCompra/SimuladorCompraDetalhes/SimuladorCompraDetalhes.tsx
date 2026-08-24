import React from 'react'
import { Link } from 'react-router-dom'
import { Collapse } from 'reactstrap'
import { formatCurrency } from 'helpers/fatura_helpers'
import { CartaoChip } from 'helpers/cartao_helpers'
import { SimuladorImpacto, SimuladorParcela } from 'interfaces/SimuladorCompra/SimuladorCompraInterface'
import { ProjecaoFaturasView } from 'interfaces/ProjecaoFaturas/ProjecaoFaturasInterface'
import ProjecaoFaturasTable from 'pages/Pages/ProjecaoFaturas/ProjecaoFaturasTable/ProjecaoFaturasTable'
import SimuladorCompraTimeline from '../SimuladorCompraTimeline/SimuladorCompraTimeline'

type BreakdownItem = {
  cartao_id: number
  nome: string
  cor_fundo?: string | null
  cor_texto?: string | null
  antes: number
  simulado: number
  depois: number
  eh_simulado: boolean
}

type Props = {
  aberto: boolean
  onToggle: () => void
  impacto: SimuladorImpacto | null
  cartaoNome: string
  competenciaLabel: string
  valorParcela: number
  alertaLimite: boolean
  parcelasFora: number
  labelFimJanela: string
  parcelas: SimuladorParcela[]
  onSelectParcela: (parcela: SimuladorParcela) => void
  verTodos: boolean
  onVerTodos: (v: boolean) => void
  overlay?: ProjecaoFaturasView
  cartaoId: number | string | null
  responsavelId: number | string | null
  ehEu: boolean
  responsavelNome: string
  breakdown: BreakdownItem[]
  faturaPath?: string
  visualizarPath?: string
}

const SimuladorCompraDetalhes = ({
  aberto,
  onToggle,
  impacto,
  cartaoNome,
  competenciaLabel,
  valorParcela,
  alertaLimite,
  parcelasFora,
  labelFimJanela,
  parcelas,
  onSelectParcela,
  verTodos,
  onVerTodos,
  overlay,
  cartaoId,
  responsavelId,
  ehEu,
  responsavelNome,
  breakdown,
  faturaPath,
  visualizarPath,
}: Props) => {
  const fatura = impacto?.fatura_cartao
  const pct = fatura?.percentual_em_uso_depois

  return (
    <div className="mb-4">
      <button
        type="button"
        className="btn btn-ghost-secondary w-100 text-start d-flex align-items-center justify-content-between"
        onClick={onToggle}
        aria-expanded={aberto}
      >
        <span>
          <i className={`ri-arrow-${aberto ? 'up' : 'down'}-s-line me-1`}></i>
          Ver detalhes
        </span>
        <span className="text-muted fs-12">fatura do cartão, limite e próximos meses</span>
      </button>

      <Collapse isOpen={aberto}>
        {aberto && (
        <div className="pt-3">
          {alertaLimite && (
            <div className="alert alert-warning py-2 fs-13">
              Uso do limite acima de 80% depois desta compra.
            </div>
          )}

          {parcelasFora > 0 && (
            <div className="alert alert-warning py-2 fs-13">
              {parcelasFora} parcela{parcelasFora === 1 ? '' : 's'} caem depois de {labelFimJanela}.
              Troque a data ou registre a compra para ver o restante na Projeção.
            </div>
          )}

          {fatura && (
            <div className="card mb-3">
              <div className="card-body">
                <h6 className="mb-2">
                  Como fica a fatura do cartão
                </h6>
                <p className="text-muted fs-13 mb-3">
                  Fatura {cartaoNome || 'do cartão'} · {competenciaLabel}
                </p>
                <p className="mb-2 fs-14">
                  Antes {formatCurrency(fatura.antes)}
                  {'   + parcela '}
                  {formatCurrency(valorParcela)}
                  {'   = '}
                  <strong>{formatCurrency(fatura.depois)}</strong>
                </p>
                {fatura.limite != null && Number(fatura.limite) > 0 ? (
                  <p className="text-muted fs-13 mb-0">
                    Limite {formatCurrency(fatura.limite)}
                    {' · em uso '}
                    {pct != null ? `${Math.round(pct)}%` : '—'}
                    {fatura.livre_depois != null ? ` · livre ${formatCurrency(fatura.livre_depois)}` : ''}
                  </p>
                ) : (
                  <p className="text-muted fs-13 mb-0">Sem limite cadastrado neste cartão.</p>
                )}
              </div>
            </div>
          )}

          <div className="card mb-3">
            <div className="card-body">
              <h6 className="mb-3">Próximas faturas deste cartão</h6>
              <SimuladorCompraTimeline parcelas={parcelas} onSelect={onSelectParcela} />
            </div>
          </div>

          {breakdown.length > 1 && impacto?.competencia && (
            <div className="card mb-3">
              <div className="card-body">
                <h6 className="mb-3">
                  {impacto.competencia.label} · {ehEu ? 'Você' : responsavelNome} por cartão
                </h6>
                <div className="d-flex flex-column gap-2">
                  {breakdown.map((item) => (
                    <div
                      key={item.cartao_id}
                      className="d-flex flex-wrap align-items-center justify-content-between gap-2"
                    >
                      <span className="d-flex align-items-center gap-2">
                        <CartaoChip
                          cor_fundo={item.cor_fundo}
                          cor_texto={item.cor_texto}
                          label={item.nome.slice(0, 1)}
                        />
                        <span>
                          {item.nome}
                          {item.eh_simulado && (
                            <span className="badge bg-primary-subtle text-primary ms-2">simulação</span>
                          )}
                        </span>
                      </span>
                      <span>
                        {formatCurrency(item.antes)}
                        {item.simulado > 0 && (
                          <>
                            {' + '}
                            {formatCurrency(item.simulado)} = {formatCurrency(item.depois)}
                          </>
                        )}
                        {item.simulado <= 0 && <> = {formatCurrency(item.depois)}</>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                id="ver-todos-simulador"
                checked={verTodos}
                onChange={(e) => onVerTodos(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="ver-todos-simulador">
                Ver todos os cartões / responsáveis
              </label>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {faturaPath && (
                <Link to={faturaPath} className="btn btn-soft-secondary btn-sm">
                  Fatura do responsável
                </Link>
              )}
              {visualizarPath && (
                <Link to={visualizarPath} className="btn btn-soft-secondary btn-sm">
                  Ver responsável
                </Link>
              )}
              <Link to="/projecao-faturas" className="btn btn-soft-primary btn-sm">
                Ir para a Projeção
              </Link>
            </div>
          </div>

          <h6 className="mb-3">Como fica o responsável nos próximos meses</h6>
          <ProjecaoFaturasTable
            data={overlay}
            filtroCartaoId={verTodos ? null : cartaoId ? Number(cartaoId) : null}
            filtroResponsavelId={verTodos ? null : responsavelId ? Number(responsavelId) : null}
            destacarResponsavelId={responsavelId ? Number(responsavelId) : null}
            visoes={verTodos ? undefined : ['cartao', 'cruzamento', 'responsavel']}
            cruzamentoInline={!verTodos}
            hideRepasses
            tituloCartao="Cartão selecionado"
            tituloCruzamento="Neste cartão × responsável"
            tituloResponsavel={ehEu ? 'Meu total (todos os cartões)' : 'Responsável · todos os cartões'}
          />
        </div>
        )}
      </Collapse>
    </div>
  )
}

export default SimuladorCompraDetalhes
