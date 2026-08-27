import React from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button } from 'reactstrap'
import {
  conciliadaComManual,
  identificadorCompraManualVinculada,
  labelConciliadaComManual,
  labelPrecisaConciliar,
  labelSugestaoConciliacao,
  pathVisualizacaoCompra,
  precisaConciliarCompra,
  temSugestaoConciliacao,
} from 'helpers/cadastro_manual_compra_helpers'
import { TransacoesList } from 'interfaces/Transacoes/TransacoesInterface'

interface FaturaConciliacaoLinhaProps {
  tx: TransacoesList
  saving: boolean
  faturaId?: number | string | null
  mes?: number | null
  ano?: number | null
  onConfirmar: (tx: TransacoesList) => void
  onEscolher: (tx: TransacoesList) => void
  onDesvincular: (tx: TransacoesList) => void
  onRejeitar: (tx: TransacoesList) => void
}

const FaturaConciliacaoLinha = ({
  tx,
  saving,
  faturaId,
  mes,
  ano,
  onConfirmar,
  onEscolher,
  onDesvincular,
  onRejeitar,
}: FaturaConciliacaoLinhaProps) => {
  const precisa = precisaConciliarCompra(tx)
  const sugestao = temSugestaoConciliacao(tx)
  const conciliada = conciliadaComManual(tx)
  const vinculadaId = identificadorCompraManualVinculada(tx)
  const compraManualTo = vinculadaId
    ? pathVisualizacaoCompra(vinculadaId, mes, ano)
    : null
  const fromState = faturaId != null ? { from: `/faturas/view/${faturaId}` } : undefined

  if (!precisa && !sugestao && !conciliada) return null

  return (
    <div className="d-flex flex-wrap align-items-center gap-1 mt-1">
      {precisa ? (
        <>
          <Badge
            color="warning"
            className="fw-normal"
            style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#fff' }}
          >
            <i className="ri-alert-line me-1"></i>
            {labelPrecisaConciliar(tx)}
          </Badge>
          <Button color="primary" outline size="sm" disabled={saving} onClick={() => onEscolher(tx)}>
            Conciliar
          </Button>
        </>
      ) : null}

      {sugestao ? (
        <>
          <Badge
            color="info"
            className="fw-normal"
            style={{ backgroundColor: '#0ea5e9', borderColor: '#0ea5e9', color: '#fff' }}
          >
            {labelSugestaoConciliacao(tx)}
          </Badge>
          <Button color="success" size="sm" disabled={saving} onClick={() => onConfirmar(tx)}>
            Confirmar
          </Button>
          <Button color="secondary" outline size="sm" disabled={saving} onClick={() => onEscolher(tx)}>
            Escolher outra
          </Button>
          <Button color="light" size="sm" disabled={saving} onClick={() => onRejeitar(tx)}>
            Não é esta
          </Button>
        </>
      ) : null}

      {conciliada ? (
        <>
          {compraManualTo ? (
            <Link
              to={compraManualTo}
              state={fromState}
              className="badge bg-success text-decoration-none fw-normal"
              title="Abrir a compra manual para conferir, editar ou desvincular"
            >
              {labelConciliadaComManual(tx)}
            </Link>
          ) : (
            <Badge color="success" className="fw-normal">
              {labelConciliadaComManual(tx)}
            </Badge>
          )}
          <Button color="danger" outline size="sm" disabled={saving} onClick={() => onDesvincular(tx)}>
            Desvincular
          </Button>
        </>
      ) : null}
    </div>
  )
}

export default FaturaConciliacaoLinha
