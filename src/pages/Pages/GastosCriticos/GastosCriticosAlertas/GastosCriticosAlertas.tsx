import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Card, CardBody } from 'reactstrap'
import { CurrencyValue } from 'Components/Common/CurrencyValue'
import {
  atalhoToPath,
  atalhoToPeriodoState,
  alertasDiagnostico,
  motivoChipColor,
  motivoLabel,
  severidadeBadge,
} from 'helpers/gastos_criticos_helpers'
import { GastosCriticosAlerta } from 'interfaces/GastosCriticos/GastosCriticosInterface'

interface GastosCriticosAlertasProps {
  alertas?: GastosCriticosAlerta[] | null
}

const GastosCriticosAlertas = ({ alertas }: GastosCriticosAlertasProps) => {
  const navigate = useNavigate()
  const lista = alertasDiagnostico(alertas)
  if (lista.length === 0) return null

  return (
    <Card className="mb-3">
      <CardBody>
        <h5 className="card-title mb-1">Pontos críticos</h5>
        <p className="text-muted fs-13 mb-3">
          O sistema cruzou valor, frequência e evolução. Não é só categoria.
        </p>

        <div className="d-flex flex-column gap-3">
          {lista.map((alerta, index) => {
            const path = atalhoToPath(alerta.atalho)
            const badge = severidadeBadge(alerta.severidade)
            const motivos = Array.isArray(alerta.motivos) ? alerta.motivos : []
            const metricas = alerta.metricas
            const compras = metricas?.compras
            const frequencia = metricas?.frequencia?.label

            return (
              <div
                key={alerta.id || `${alerta.titulo}-${index}`}
                className={`border rounded p-3 ${path ? 'card-animate' : ''}`}
                role={path ? 'button' : undefined}
                tabIndex={path ? 0 : undefined}
                title={path ? 'Ver detalhes' : undefined}
                onClick={() => {
                  if (!path) return
                  navigate(path, { state: atalhoToPeriodoState(alerta.atalho) })
                }}
                onKeyDown={(e) => {
                  if (path && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    navigate(path, { state: atalhoToPeriodoState(alerta.atalho) })
                  }
                }}
                style={path ? { cursor: 'pointer' } : undefined}
              >
                <div className="d-flex flex-wrap align-items-center gap-1 mb-2">
                  <Badge color={badge.color} pill>
                    {badge.label}
                  </Badge>
                  {motivos.map((motivo) => (
                    <Badge key={`${alerta.id}-${motivo}`} color={motivoChipColor(motivo)} pill className="bg-opacity-75">
                      {motivoLabel(motivo)}
                    </Badge>
                  ))}
                </div>

                <h6 className="mb-1">{alerta.titulo || alerta.entidade?.nome_exibicao || '—'}</h6>
                {alerta.frase ? <p className="mb-1">{alerta.frase}</p> : null}
                {alerta.contexto ? <p className="text-muted mb-2 fs-13">{alerta.contexto}</p> : null}

                <div className="d-flex flex-wrap gap-3 text-muted fs-13">
                  {compras != null ? (
                    <span>
                      {compras} {Number(compras) === 1 ? 'compra' : 'compras'}
                    </span>
                  ) : null}
                  {metricas?.valor_total != null ? (
                    <CurrencyValue value={metricas.valor_total} />
                  ) : null}
                  {frequencia ? <span>{frequencia}</span> : null}
                </div>
              </div>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}

export default GastosCriticosAlertas
