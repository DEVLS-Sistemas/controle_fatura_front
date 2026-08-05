import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Badge,
  Button,
  Col,
  DropdownItem,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
  Table,
} from 'reactstrap'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { InputDate } from 'Components/ComponentController/Inputs/Date/InputDate'
import TableActionsDropdown from 'Components/Common/TableActionsDropdown'
import {
  centavosToBr,
  formatCurrency,
  formatDateBr,
  statusRepasseColor,
  statusRepasseLabel,
  toCentavos,
  VALOR_TEXT_CLASS,
} from 'helpers/fatura_helpers'
import { ValidationError } from 'libs/api/exceptions/ValidationError'
import {
  RepasseCelula,
  RepasseList,
  RepasseModel,
  StatusRepasse,
} from 'interfaces/Repasses/RepassesInterface'
import { RepassesService } from 'services/Repasses/RepassesService'

export type RepasseModalContext = {
  estabelecimento?: string | null
  observacoes?: string | null
  competenciaLabel?: string
  celula: RepasseCelula
}

export type RepasseModalProps = {
  isOpen: boolean
  toggle: () => void
  context: RepasseModalContext | null
  onSaved: () => void | Promise<void>
}

type ModalForm = {
  data_pagamento: string | null
  valor: string | null
  observacoes: string | null
}

const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const toBrPayload = (value: string | number | null | undefined): string =>
  centavosToBr(toCentavos(value))

const validationMessage = (error: unknown): string => {
  if (error instanceof ValidationError) {
    const body = error.errors as any
    if (typeof body?.message === 'string') return body.message
    if (Array.isArray(body?.errors)) {
      const first = body.errors[0]
      if (typeof first === 'string') return first
      if (first?.message) return String(first.message)
    }
    if (body && typeof body === 'object') {
      const values = Object.values(body)
      for (const v of values) {
        if (Array.isArray(v) && v[0]) return String(v[0])
        if (typeof v === 'string') return v
      }
    }
    return error.message
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as Error).message)
  }
  return 'Erro ao salvar repasse'
}

const RepasseModal = ({ isOpen, toggle, context, onSaved }: RepasseModalProps) => {
  const service = useRef(new RepassesService()).current
  const [loadingList, setLoadingList] = useState(false)
  const [saving, setSaving] = useState(false)
  const [repasses, setRepasses] = useState<RepasseList[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)

  const celula = context?.celula
  const valorDevido = Number(celula?.valor_devido ?? 0)
  const valorPagoLista = repasses.reduce((acc, item) => acc + Number(item.valor ?? 0), 0)
  const valorPago = loadingList ? Number(celula?.valor_pago ?? 0) : valorPagoLista
  const valorAberto = loadingList
    ? Number(celula?.valor_aberto ?? Math.max(valorDevido - valorPago, 0))
    : Math.max(valorDevido - valorPagoLista, 0)
  const status: StatusRepasse =
    valorPago <= 0 ? 'pendente' : valorAberto <= 0 ? 'pago' : 'parcial'

  const { control, handleSubmit, register, reset, setValue, formState: { errors } } = useForm<ModalForm>({
    defaultValues: {
      data_pagamento: todayIso(),
      valor: null,
      observacoes: null,
    },
  })

  const loadRepasses = useCallback(async () => {
    if (!celula?.transacao_id) {
      setRepasses([])
      return
    }
    setLoadingList(true)
    try {
      const list = await service.listRepasses({ transacao_id: celula.transacao_id })
      setRepasses(list)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar repasses da parcela')
      setRepasses([])
    } finally {
      setLoadingList(false)
    }
  }, [celula?.transacao_id, service])

  useEffect(() => {
    if (!isOpen || !celula) return
    setEditingId(null)
    const abertoInicial = Number(celula.valor_aberto ?? 0)
    const devidoInicial = Number(celula.valor_devido ?? 0)
    reset({
      data_pagamento: todayIso(),
      valor: String(toCentavos(abertoInicial > 0 ? abertoInicial : devidoInicial)),
      observacoes: null,
    })
    loadRepasses()
  }, [isOpen, celula, reset, loadRepasses])

  const resetFormNovo = () => {
    setEditingId(null)
    setValue('data_pagamento', todayIso())
    setValue('valor', String(toCentavos(valorAberto > 0 ? valorAberto : 0)))
    setValue('observacoes', null)
  }

  const startEdit = (item: RepasseList) => {
    if (!item.id) return
    setEditingId(item.id)
    setValue('data_pagamento', item.data_pagamento ?? todayIso())
    setValue('valor', String(toCentavos(item.valor)))
    setValue('observacoes', item.observacoes ?? null)
  }

  const onSubmit = async (data: ModalForm) => {
    if (!celula?.transacao_id) return
    const valorCentavos = toCentavos(data.valor)
    if (valorCentavos <= 0) {
      toast.error('Informe um valor maior que zero')
      return
    }
    if (!editingId && valorCentavos > toCentavos(valorAberto) + 1) {
      toast.error('Valor excede o em aberto da parcela')
      return
    }

    setSaving(true)
    try {
      const payload: RepasseModel = {
        id: editingId,
        transacao_id: celula.transacao_id,
        valor: toBrPayload(data.valor),
        data_pagamento: data.data_pagamento,
        observacoes: data.observacoes?.trim() || null,
      }
      if (editingId) {
        await service.editRepasse(payload)
        toast.success('Repasse atualizado')
        await onSaved()
        await loadRepasses()
        resetFormNovo()
      } else {
        await service.createRepasse(payload)
        toast.success('Repasse registrado')
        await onSaved()
        toggle()
      }
    } catch (error) {
      console.error(error)
      toast.error(validationMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleQuitar = async () => {
    if (!celula?.transacao_id) return
    if (valorAberto <= 0) {
      toast.info('Parcela já está quitada com o responsável')
      return
    }
    setSaving(true)
    try {
      await service.createRepasse({
        transacao_id: celula.transacao_id,
        quitar: true,
        data_pagamento: todayIso(),
      })
      toast.success('Parcela quitada com o responsável')
      await onSaved()
      toggle()
    } catch (error) {
      console.error(error)
      toast.error(validationMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id?: number) => {
    if (!id) return
    if (!window.confirm('Excluir este repasse?')) return
    setSaving(true)
    try {
      await service.deleteRepasse(id)
      toast.success('Repasse excluído')
      if (editingId === id) resetFormNovo()
      await onSaved()
      await loadRepasses()
    } catch (error) {
      console.error(error)
      toast.error(validationMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const parcelaLabel =
    celula?.parcelas_total && celula.parcelas_total > 1
      ? `${celula.parcela_atual ?? '?'}/${celula.parcelas_total}`
      : 'À vista'

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" centered>
      <ModalHeader toggle={toggle}>
        Registrar repasse
      </ModalHeader>
      <ModalBody>
        {context && celula ? (
          <>
            <div className="mb-3">
              <div className="fw-semibold">
                {context.estabelecimento || 'Compra'}
                {context.observacoes ? (
                  <span className="text-muted fw-normal"> · {context.observacoes}</span>
                ) : null}
              </div>
              <div className="text-muted small">
                Parcela {parcelaLabel}
                {context.competenciaLabel ? ` · ${context.competenciaLabel}` : ''}
              </div>
            </div>

            <Row className="g-2 mb-3 text-center text-md-start">
              <Col xs={4}>
                <small className="text-muted text-uppercase d-block">Devido</small>
                <span className={`fw-semibold ${VALOR_TEXT_CLASS}`}>{formatCurrency(valorDevido)}</span>
              </Col>
              <Col xs={4}>
                <small className="text-muted text-uppercase d-block">Já repassado</small>
                <span className={`fw-semibold ${VALOR_TEXT_CLASS}`}>{formatCurrency(valorPago)}</span>
              </Col>
              <Col xs={4}>
                <small className="text-muted text-uppercase d-block">Em aberto</small>
                <span className={`fw-semibold text-danger ${VALOR_TEXT_CLASS}`}>{formatCurrency(valorAberto)}</span>
                <div className="mt-1">
                  <Badge color={statusRepasseColor[status] ?? 'secondary'}>
                    {statusRepasseLabel[status] ?? status}
                  </Badge>
                </div>
              </Col>
            </Row>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Repasses lançados</h6>
                {loadingList && <Spinner size="sm" />}
              </div>
              {repasses.length === 0 && !loadingList ? (
                <div className="text-muted small">Nenhum repasse nesta parcela.</div>
              ) : (
                <div className="table-responsive">
                  <Table size="sm" className="align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Data</th>
                        <th className={VALOR_TEXT_CLASS}>Valor</th>
                        <th>Obs.</th>
                        <th style={{ width: 50 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {repasses.map((item) => (
                        <tr key={item.id} className={editingId === item.id ? 'table-warning' : undefined}>
                          <td>{formatDateBr(item.data_pagamento)}</td>
                          <td className={VALOR_TEXT_CLASS}>{formatCurrency(item.valor)}</td>
                          <td className="text-muted small">{item.observacoes || '—'}</td>
                          <td>
                            <TableActionsDropdown toggleClassName="btn btn-sm">
                              <DropdownItem onClick={() => startEdit(item)}>Editar</DropdownItem>
                              <DropdownItem className="text-danger" onClick={() => handleDelete(item.id)}>
                                Excluir
                              </DropdownItem>
                            </TableActionsDropdown>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>

            <hr />

            <form id="repasse-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">{editingId ? 'Editar repasse' : 'Novo repasse'}</h6>
                {editingId && (
                  <Button type="button" color="link" size="sm" className="p-0" onClick={resetFormNovo}>
                    Cancelar edição
                  </Button>
                )}
              </div>
              <Row className="g-3">
                <Col md={4}>
                  <Label className="form-label">Data do repasse</Label>
                  <InputDate<ModalForm>
                    field="data_pagamento"
                    register={register}
                    required={required('Data obrigatória')}
                    errors={errors.data_pagamento}
                  />
                </Col>
                <Col md={4}>
                  <Label className="form-label">Valor</Label>
                  <InputTextControlled<ModalForm>
                    field="valor"
                    control={control}
                    mask="preco"
                    textValor
                    required={required('Valor obrigatório')}
                    errors={errors.valor}
                    placeholder="0,00"
                  />
                </Col>
                <Col md={4}>
                  <Label className="form-label">Observações</Label>
                  <InputTextControlled<ModalForm>
                    field="observacoes"
                    control={control}
                    placeholder="PIX, transferência..."
                    errors={errors.observacoes}
                  />
                </Col>
              </Row>
            </form>
          </>
        ) : (
          <div className="text-muted">Selecione uma parcela.</div>
        )}
      </ModalBody>
      <ModalFooter className="d-flex flex-wrap gap-2 justify-content-between">
        <div className="d-flex gap-2">
          <Button
            type="button"
            color="success"
            outline
            disabled={saving || !celula || valorAberto <= 0}
            onClick={handleQuitar}
          >
            Quitar restante
          </Button>
        </div>
        <div className="d-flex gap-2">
          <Button type="button" color="light" onClick={toggle} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="repasse-form" color="primary" disabled={saving || !celula}>
            {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

export default RepasseModal
