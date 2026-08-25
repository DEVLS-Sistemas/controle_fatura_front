import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Breadcrumb, BreadcrumbItem, Card, CardHeader, Col, Collapse, Label, Row } from 'reactstrap'
import UiContent from 'Components/Common/UiContent'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
  GastosCriticosDefaultValues,
  GastosCriticosMeses,
  GastosCriticosSearch,
} from 'interfaces/GastosCriticos/GastosCriticosInterface'
import { MESES_OPCOES } from 'helpers/gastos_criticos_helpers'

interface GastosCriticosHeaderProps {
  defaultValues?: GastosCriticosSearch
  cartoesOptions: SelectOptions[]
  responsaveisOptions: SelectOptions[]
  periodoLabel?: string | null
  periodoInicio?: string | null
  periodoFim?: string | null
  onChange: (filters: GastosCriticosSearch) => void
}

const GastosCriticosHeader = ({
  defaultValues = GastosCriticosDefaultValues,
  cartoesOptions,
  responsaveisOptions,
  periodoLabel,
  periodoInicio,
  periodoFim,
  onChange,
}: GastosCriticosHeaderProps) => {
  const { control, watch, setValue, getValues } = useForm<GastosCriticosSearch>({
    defaultValues,
  })
  const hasAdvancedDefault = Boolean(defaultValues.cartao_id || defaultValues.responsavel_id)
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedDefault)

  const mesesWatch = Number(watch('meses') ?? 3) as GastosCriticosMeses
  const intervalo =
    periodoInicio && periodoFim ? `${periodoInicio} → ${periodoFim}` : periodoInicio || periodoFim || null

  const emitChange = (patch: Partial<GastosCriticosSearch>) => {
    const current = getValues()
    onChange({
      ...current,
      ...patch,
      mes: null,
      ano: null,
      data_inicio: null,
      data_fim: null,
    })
  }

  const handleMeses = (meses: GastosCriticosMeses) => {
    setValue('meses', meses)
    emitChange({ meses })
  }

  return (
    <React.Fragment>
      <UiContent />

      <Row>
        <Col xs={12}>
          <div className="page-title-box d-sm-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <Link to="/dashboard" className="me-2">
                <i className="bx bx-arrow-back bx-sm"></i>
              </Link>
              <div>
                <h4 className="mb-0">Onde estou gastando demais?</h4>
                <p className="text-muted mb-0 fs-13">
                  {periodoLabel || 'Diagnóstico por loja, frequência e evolução'}
                  {intervalo ? ` · ${intervalo}` : ''}
                </p>
              </div>
            </div>
            <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-2">
              <button
                type="button"
                className={`btn btn-sm ${showAdvanced ? 'btn-secondary' : 'btn-soft-secondary'}`}
                onClick={() => setShowAdvanced((open) => !open)}
              >
                <i className="ri-filter-3-line align-middle me-1"></i>
                Filtros
              </button>
              <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                <BreadcrumbItem>
                  <Link to="/dashboard">
                    <i className="ri-home-5-fill"></i>
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbItem active>Gastos críticos</BreadcrumbItem>
              </Breadcrumb>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <Card className="mb-3">
            <CardHeader>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                  <p className="text-uppercase fw-medium text-muted mb-1 fs-12">Período</p>
                  <div className="btn-group flex-wrap" role="group" aria-label="Período em meses">
                    {MESES_OPCOES.map((opcao) => (
                      <button
                        key={opcao.value}
                        type="button"
                        className={`btn btn-sm ${mesesWatch === opcao.value ? 'btn-primary' : 'btn-soft-primary'}`}
                        onClick={() => handleMeses(opcao.value)}
                      >
                        {opcao.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Collapse isOpen={showAdvanced}>
                <Row className="align-items-end g-3 mt-2">
                  <Col md={6} lg={4}>
                    <div className="mb-0">
                      <Label htmlFor="cartao_id" className="form-label">
                        Cartão
                      </Label>
                      <SelectListControlled<GastosCriticosSearch>
                        field="cartao_id"
                        control={control}
                        options={cartoesOptions}
                      />
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="mb-0">
                      <Label htmlFor="responsavel_id" className="form-label">
                        Responsável
                      </Label>
                      <SelectListControlled<GastosCriticosSearch>
                        field="responsavel_id"
                        control={control}
                        options={responsaveisOptions}
                      />
                    </div>
                  </Col>
                  <Col md={12} lg={4}>
                    <button
                      type="button"
                      className="btn btn-success w-100"
                      onClick={() => emitChange({})}
                    >
                      <i className="ri-search-line align-middle me-1"></i>
                      Aplicar filtros
                    </button>
                  </Col>
                </Row>
              </Collapse>
            </CardHeader>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  )
}

export default GastosCriticosHeader
