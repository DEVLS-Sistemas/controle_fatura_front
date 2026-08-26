import React, { useState } from 'react'
import { Button, Card, CardBody, CardHeader, Collapse, Spinner } from 'reactstrap'
import { toast } from 'react-toastify'
import { formatDateBr } from 'helpers/fatura_helpers'
import { identificadorDaCompra } from 'helpers/cadastro_manual_compra_helpers'
import { CompraVisualizacaoView } from 'interfaces/CompraVisualizacao/CompraVisualizacaoInterface'
import { CompraHistoricoItem } from 'interfaces/Transacoes/TransacoesInterface'
import { TransacoesService } from 'services/Transacoes/TransacoesService'

interface CompraVisualizacaoHistoricoProps {
  compra: CompraVisualizacaoView
}

const CompraVisualizacaoHistorico = ({ compra }: CompraVisualizacaoHistoricoProps) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<CompraHistoricoItem[] | null>(null)
  const transacoesService = new TransacoesService()
  const identificador = identificadorDaCompra(compra)

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (!next || items != null || !identificador) return
    setLoading(true)
    try {
      const list = await transacoesService.getHistoricoTransacao(identificador)
      setItems(
        [...list].sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
      )
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar histórico')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-3">
      <CardHeader className="d-flex align-items-center justify-content-between">
        <h5 className="card-title mb-0">Histórico</h5>
        <Button color="light" size="sm" className="border" onClick={toggle}>
          {open ? 'Ocultar' : 'Mostrar'}
        </Button>
      </CardHeader>
      <Collapse isOpen={open}>
        <CardBody>
          {loading ? (
            <div className="text-center py-3">
              <Spinner color="primary" size="sm" />
            </div>
          ) : !items?.length ? (
            <p className="text-muted mb-0">Nenhum evento registrado.</p>
          ) : (
            <ul className="list-unstyled mb-0">
              {items.map((item, index) => (
                <li key={item.id ?? index} className="border-bottom py-2">
                  <div>{item.descricao || item.acao || 'Evento'}</div>
                  {item.created_at ? (
                    <small className="text-muted">{formatDateBr(item.created_at)}</small>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Collapse>
    </Card>
  )
}

export default CompraVisualizacaoHistorico
