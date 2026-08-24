import React from 'react'
import { Link } from 'react-router-dom'
import { Control, UseFormRegister } from 'react-hook-form'
import { Button, Card, CardBody, Col, Collapse, Label, Row } from 'reactstrap'
import { InputDate } from 'Components/ComponentController/Inputs/Date/InputDate'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
  SimuladorCompraFormValues,
  SimuladorOverlayResult,
} from 'interfaces/SimuladorCompra/SimuladorCompraInterface'
import {
  centavosToBr,
  formatCurrency,
  mesesOptions,
  parcelasOptions,
  toCentavos,
  VALOR_TEXT_CLASS,
} from 'helpers/fatura_helpers'
import { AnosSelect, mask } from 'helpers/functions_helpers'

type Props = {
  register: UseFormRegister<SimuladorCompraFormValues>
  control: Control<SimuladorCompraFormValues>
  pessoasOptions: SelectOptions[]
  cartoesOptions: SelectOptions[]
  semCartoes: boolean
  overlay: SimuladorOverlayResult
  valorCentavos: number
  nParcelas: number
  parcelasValores: string[]
  totaisBatem: boolean
  diaLimite: number | null
  cartaoNome: string
  responsavelNome: string
  isMeuResponsavel: boolean
  parcelasOpen: boolean
  onToggleParcelas: () => void
  onParcelaChange: (index: number, raw: string) => void
  onTrocarResponsavel: () => void
}

const optParcelas: SelectOptions[] = parcelasOptions.map((p) => ({
  value: p.value,
  label: p.label === '1' ? '1x · à vista' : `${p.label}x`,
}))

const SimuladorCompraForm = ({
  register,
  control,
  pessoasOptions,
  cartoesOptions,
  semCartoes,
  overlay,
  valorCentavos,
  nParcelas,
  parcelasValores,
  totaisBatem,
  diaLimite,
  cartaoNome,
  responsavelNome,
  isMeuResponsavel,
  parcelasOpen,
  onToggleParcelas,
  onParcelaChange,
  onTrocarResponsavel,
}: Props) => {
  const valorLabel = valorCentavos > 0 ? formatCurrency(valorCentavos / 100) : 'R$ …'
  const nLabel = nParcelas > 1 ? `${nParcelas}x` : 'à vista'
  const primeira = overlay.primeira
  const ultima = overlay.ultima
  const valorParcela =
    primeira && primeira.valor > 0
      ? primeira.valor
      : nParcelas > 0 && valorCentavos > 0
        ? valorCentavos / 100 / nParcelas
        : 0

  const optMeses: SelectOptions[] = mesesOptions.map((m) => ({
    value: m.value,
    label: m.label,
  }))
  const optAnos = AnosSelect()

  return (
    <Card className="mb-3 sticky-lg-top" style={{ zIndex: 11, top: 70 }}>
      <CardBody>
        <p className="fs-15 mb-3">
          Se eu comprar <strong>{valorLabel}</strong> em <strong>{nLabel}</strong>
          {cartaoNome ? <> no <strong>{cartaoNome}</strong></> : null}
          {responsavelNome ? (
            <>
              , no nome de <strong>{isMeuResponsavel ? 'Eu' : responsavelNome}</strong>
            </>
          ) : null}
          , como ficam as próximas faturas?
        </p>

        <Row className="g-3 align-items-end">
          <Col lg={2} md={4} sm={6}>
            <Label className="form-label">Titular</Label>
            <SelectListControlled<SimuladorCompraFormValues>
              field="pessoa_id"
              control={control}
              options={pessoasOptions}
              required={required}
            />
          </Col>
          <Col lg={3} md={8} sm={6}>
            <Label className="form-label">Cartão</Label>
            {semCartoes ? (
              <div className="alert alert-warning py-2 mb-0">
                Nenhum cartão deste titular.{' '}
                <Link to="/cartoes/add">Cadastrar cartão</Link>
              </div>
            ) : (
              <>
                <SelectListControlled<SimuladorCompraFormValues>
                  field="cartao_id"
                  control={control}
                  options={cartoesOptions}
                  required={required}
                />
                {diaLimite != null && (
                  <small className="text-muted">Fecha dia {diaLimite} · ciclo da 1ª parcela</small>
                )}
              </>
            )}
          </Col>
          <Col lg={2} md={4} sm={6}>
            <Label className="form-label text-muted">Responsável</Label>
            <Button
              type="button"
              color="light"
              className="border w-100 text-start"
              onClick={onTrocarResponsavel}
              title="Definir responsável"
            >
              <i className="ri-user-line me-2"></i>
              {isMeuResponsavel ? 'Eu' : responsavelNome || 'Selecionar'}
              <i className="ri-arrow-down-s-line float-end mt-1"></i>
            </Button>
            <small className="text-muted">Clique para trocar</small>
          </Col>
          <Col lg={2} md={4} sm={6}>
            <Label className="form-label">Valor da compra</Label>
            <InputTextControlled<SimuladorCompraFormValues>
              field="valor_compra"
              control={control}
              textValor
              mask="preco"
              placeholder="0,00"
            />
          </Col>
          <Col lg={1} md={2} sm={6}>
            <Label className="form-label">Parcelas</Label>
            <SelectListControlled<SimuladorCompraFormValues>
              field="parcelas_total"
              control={control}
              options={optParcelas}
              required={required}
            />
          </Col>
          <Col lg={2} md={4} sm={6}>
            <Label className="form-label">Data</Label>
            <InputDate<SimuladorCompraFormValues> field="data" register={register} />
          </Col>
        </Row>

        <Row className="g-3 mt-1">
          <Col md={3} sm={6}>
            <Label className="form-label">Mês de referência</Label>
            <SelectListControlled<SimuladorCompraFormValues>
              field="mes"
              control={control}
              options={optMeses}
            />
          </Col>
          <Col md={3} sm={6}>
            <Label className="form-label">Ano de referência</Label>
            <SelectListControlled<SimuladorCompraFormValues>
              field="ano"
              control={control}
              options={optAnos}
            />
          </Col>
          <Col md={6} className="d-flex align-items-end">
            {valorCentavos <= 0 ? (
              <span className="text-muted fs-13">
                Informe o valor para ver o impacto sobre as faturas.
              </span>
            ) : (
              <div className="d-flex flex-wrap gap-3 fs-13">
                <span>
                  <span className="text-muted">Parcela</span>{' '}
                  <strong className={VALOR_TEXT_CLASS}>{formatCurrency(valorParcela)}</strong>
                </span>
                {primeira && (
                  <span>
                    <span className="text-muted">1ª fatura</span> <strong>{primeira.label}</strong>
                    {diaLimite != null && (
                      <span className="text-muted"> (compras até dia {diaLimite} entram neste mês)</span>
                    )}
                  </span>
                )}
                {ultima && nParcelas > 1 && (
                  <span>
                    <span className="text-muted">Última</span> <strong>{ultima.label}</strong>
                  </span>
                )}
                <span>
                  <span className="text-muted">Total</span>{' '}
                  <strong className={VALOR_TEXT_CLASS}>{formatCurrency(valorCentavos / 100)}</strong>
                </span>
              </div>
            )}
          </Col>
        </Row>

        {nParcelas > 1 && valorCentavos > 0 && (
          <div className="mt-3">
            <button
              type="button"
              className="btn btn-soft-primary btn-sm"
              onClick={onToggleParcelas}
            >
              <i className={`ri-arrow-${parcelasOpen ? 'up' : 'down'}-s-line me-1`}></i>
              Valores das parcelas
            </button>
            <Collapse isOpen={parcelasOpen}>
              <div className="border rounded p-3 bg-light mt-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-medium">Ajuste opcional</span>
                  <span className={`small ${totaisBatem ? 'text-success' : 'text-danger'}`}>
                    Total: {centavosToBr(parcelasValores.reduce((acc, v) => acc + toCentavos(v), 0))}
                    {!totaisBatem && <> · esperado {centavosToBr(valorCentavos)}</>}
                  </span>
                </div>
                <Row>
                  {parcelasValores.map((valor, idx) => (
                    <Col md={3} sm={6} key={`parcela-${idx}`}>
                      <div className="mb-2">
                        <Label className="form-label small">
                          Parcela {idx + 1}/{nParcelas}
                        </Label>
                        <input
                          type="text"
                          className={`form-control ${VALOR_TEXT_CLASS}`}
                          value={mask('preco', valor) ?? ''}
                          onChange={(e) => onParcelaChange(idx, e.target.value)}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
                {!totaisBatem && (
                  <div className="alert alert-warning mb-0 mt-2 py-2">
                    Ajuste as parcelas até o total coincidir com o valor da compra (diferença máx. R$ 0,01).
                  </div>
                )}
              </div>
            </Collapse>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default SimuladorCompraForm
