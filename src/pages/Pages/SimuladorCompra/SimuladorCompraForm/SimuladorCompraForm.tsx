import React from 'react'
import { Link } from 'react-router-dom'
import { Control, UseFormRegister } from 'react-hook-form'
import { Button, Card, CardBody, Col, Collapse, Label, Row } from 'reactstrap'
import { InputDate } from 'Components/ComponentController/Inputs/Date/InputDate'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { SimuladorCompraFormValues } from 'interfaces/SimuladorCompra/SimuladorCompraInterface'
import { parcelasOptions } from 'helpers/fatura_helpers'

type Props = {
  register: UseFormRegister<SimuladorCompraFormValues>
  control: Control<SimuladorCompraFormValues>
  showTitular: boolean
  pessoasOptions: SelectOptions[]
  cartoesOptions: SelectOptions[]
  semCartoes: boolean
  compact: boolean
  responsavelNome: string
  isMeuResponsavel: boolean
  dataAberta: boolean
  onToggleData: () => void
  onTrocarResponsavel: () => void
  onSimular: () => void
  onNovaSimulacao?: () => void
  podeSimular: boolean
  simulando: boolean
}

const optParcelas: SelectOptions[] = parcelasOptions.map((p) => ({
  value: p.value,
  label: p.label === '1' ? '1x · à vista' : `${p.label}x`,
}))

const SimuladorCompraForm = ({
  register,
  control,
  showTitular,
  pessoasOptions,
  cartoesOptions,
  semCartoes,
  compact,
  responsavelNome,
  isMeuResponsavel,
  dataAberta,
  onToggleData,
  onTrocarResponsavel,
  onSimular,
  onNovaSimulacao,
  podeSimular,
  simulando,
}: Props) => {
  const responsavelLabel = isMeuResponsavel ? 'Eu' : responsavelNome || 'Selecionar'

  return (
    <Card className={compact ? 'mb-3' : 'mb-0 shadow-sm'}>
      <CardBody className={compact ? 'py-3' : 'p-4'}>
        <Row className="g-3 align-items-end">
          {showTitular && (
            <Col lg={compact ? 2 : 12} md={6}>
              <Label className="form-label">Titular</Label>
              <SelectListControlled<SimuladorCompraFormValues>
                field="pessoa_id"
                control={control}
                options={pessoasOptions}
                required={required}
              />
            </Col>
          )}
          <Col lg={compact ? (showTitular ? 2 : 3) : 12} md={6}>
            <Label className="form-label">Cartão</Label>
            {semCartoes ? (
              <div className="alert alert-warning py-2 mb-0">
                Nenhum cartão deste titular.{' '}
                <Link to="/cartoes/add">Cadastrar cartão</Link>
              </div>
            ) : (
              <SelectListControlled<SimuladorCompraFormValues>
                field="cartao_id"
                control={control}
                options={cartoesOptions}
                required={required}
              />
            )}
          </Col>
          <Col lg={compact ? 2 : 12} md={6}>
            <Label className="form-label">Responsável</Label>
            <Button
              type="button"
              color="light"
              className="border w-100 text-start"
              onClick={onTrocarResponsavel}
              title="Definir responsável"
            >
              <i className="ri-user-line me-2"></i>
              {responsavelLabel}
              <i className="ri-arrow-down-s-line float-end mt-1"></i>
            </Button>
          </Col>
          <Col lg={compact ? 2 : 6} md={6}>
            <Label className="form-label">Valor</Label>
            <InputTextControlled<SimuladorCompraFormValues>
              field="valor_compra"
              control={control}
              textValor
              mask="preco"
              placeholder="0,00"
            />
          </Col>
          <Col lg={compact ? 2 : 6} md={6}>
            <Label className="form-label">Parcelas</Label>
            <SelectListControlled<SimuladorCompraFormValues>
              field="parcelas_total"
              control={control}
              options={optParcelas}
              required={required}
            />
          </Col>
          <Col lg={compact ? 3 : 12} md={12}>
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={onSimular}
              disabled={!podeSimular || simulando}
            >
              {simulando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" />
                  Analisando…
                </>
              ) : compact ? (
                <>
                  <i className="ri-refresh-line me-1"></i>
                  Posso comprar?
                </>
              ) : (
                <>
                  <i className="ri-shopping-bag-3-line me-1"></i>
                  Posso comprar?
                </>
              )}
            </button>
            {compact && onNovaSimulacao && (
              <button
                type="button"
                className="btn btn-link btn-sm w-100 text-muted mt-1"
                onClick={onNovaSimulacao}
              >
                Nova simulação
              </button>
            )}
          </Col>
        </Row>

        <div className="mt-3">
          <button type="button" className="btn btn-link btn-sm p-0 text-muted" onClick={onToggleData}>
            <i className={`ri-arrow-${dataAberta ? 'up' : 'down'}-s-line me-1`}></i>
            Data da compra
          </button>
          <Collapse isOpen={dataAberta}>
            <div className="mt-2" style={{ maxWidth: 220 }}>
              <InputDate<SimuladorCompraFormValues> field="data" register={register} />
              <small className="text-muted">Define o ciclo da 1ª fatura.</small>
            </div>
          </Collapse>
        </div>
      </CardBody>
    </Card>
  )
}

export default SimuladorCompraForm
