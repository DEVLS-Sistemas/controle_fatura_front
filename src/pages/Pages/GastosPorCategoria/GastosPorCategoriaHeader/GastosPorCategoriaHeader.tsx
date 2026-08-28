import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Breadcrumb, BreadcrumbItem, Card, CardHeader, Col, Collapse, Label, Row } from 'reactstrap'
import UiContent from 'Components/Common/UiContent'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { AnosSelect, mesesSelect } from 'helpers/functions_helpers'
import { MESES_OPCOES, resolverMesAnoCalendario } from 'helpers/gastos_por_categoria_helpers'
import {
  GastosPorCategoriaDefaultValues,
  GastosPorCategoriaMeses,
  GastosPorCategoriaSearch,
} from 'interfaces/GastosPorCategoria/GastosPorCategoriaInterface'

interface GastosPorCategoriaHeaderProps {
  defaultValues?: GastosPorCategoriaSearch
  cartoesOptions: SelectOptions[]
  responsaveisOptions: SelectOptions[]
  periodoLabel?: string | null
  periodoInicio?: string | null
  periodoFim?: string | null
  onChange: (filters: GastosPorCategoriaSearch) => void
}

const GastosPorCategoriaHeader = ({
  defaultValues = GastosPorCategoriaDefaultValues,
  cartoesOptions,
  responsaveisOptions,
  periodoLabel,
  periodoInicio,
  periodoFim,
  onChange,
}: GastosPorCategoriaHeaderProps) => {
  const { control, watch, setValue, getValues } = useForm<GastosPorCategoriaSearch>({
    defaultValues: {
      ...defaultValues,
      ano: defaultValues.ano ?? new Date().getFullYear(),
    },
  })
  const hasAdvancedDefault = Boolean(
    defaultValues.cartao_id || defaultValues.responsavel_id || defaultValues.mes
  )
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedDefault)

  const mesesWatch = watch('meses')
  const mesWatch = watch('mes')
  const anoWatch = watch('ano')
  const usaCalendario = Boolean(mesWatch && anoWatch)
  const mesesAtivo = usaCalendario ? null : (Number(mesesWatch ?? 3) as GastosPorCategoriaMeses)
  const intervalo =
    periodoInicio && periodoFim ? `${periodoInicio} → ${periodoFim}` : periodoInicio || periodoFim || null
  const optAnos = AnosSelect()
  const optMeses = mesesSelect()

  const emitChange = (patch: Partial<GastosPorCategoriaSearch>) => {
    const current = getValues()
    onChange({
      ...current,
      ...patch,
    })
  }

  const handleMeses = (meses: GastosPorCategoriaMeses) => {
    setValue('meses', meses)
    setValue('mes', null)
    setValue('ano', null)
    setValue('data_inicio', null)
    setValue('data_fim', null)
    emitChange({
      meses,
      mes: null,
      ano: null,
      data_inicio: null,
      data_fim: null,
    })
  }

  const handleAplicar = () => {
    const calendario = resolverMesAnoCalendario(getValues('mes'), getValues('ano'))
    if (calendario) {
      setValue('meses', null)
      setValue('mes', calendario.mes)
      setValue('ano', calendario.ano)
      emitChange({
        meses: null,
        mes: calendario.mes,
        ano: calendario.ano,
        data_inicio: null,
        data_fim: null,
      })
      return
    }

    setValue('mes', null)
    emitChange({
      mes: null,
      ano: null,
    })
  }

  const partesSubtitulo = [periodoLabel, intervalo].filter(Boolean)

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
                <h4 className="mb-0">Gastos por categoria</h4>
                <p className="text-muted mb-0 fs-13">
                  {partesSubtitulo.length > 0
                    ? partesSubtitulo.join(' · ')
                    : 'Categorias, subcategorias e tipos de compra'}
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
                <BreadcrumbItem active>Gastos por categoria</BreadcrumbItem>
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
                        className={`btn btn-sm ${mesesAtivo === opcao.value ? 'btn-primary' : 'btn-soft-primary'}`}
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
                  <Col md={6} lg={3}>
                    <div className="mb-0">
                      <Label htmlFor="cartao_id" className="form-label">
                        Cartão
                      </Label>
                      <SelectListControlled<GastosPorCategoriaSearch>
                        field="cartao_id"
                        control={control}
                        options={cartoesOptions}
                      />
                    </div>
                  </Col>
                  <Col md={6} lg={3}>
                    <div className="mb-0">
                      <Label htmlFor="responsavel_id" className="form-label">
                        Responsável
                      </Label>
                      <SelectListControlled<GastosPorCategoriaSearch>
                        field="responsavel_id"
                        control={control}
                        options={responsaveisOptions}
                      />
                    </div>
                  </Col>
                  <Col md={6} lg={3}>
                    <div className="mb-0">
                      <Label htmlFor="mes" className="form-label">
                        Mês calendário
                      </Label>
                      <SelectListControlled<GastosPorCategoriaSearch>
                        field="mes"
                        control={control}
                        options={[{ value: '', label: 'Janela (1–12 meses)' }, ...optMeses]}
                      />
                    </div>
                  </Col>
                  <Col md={6} lg={3}>
                    <div className="mb-0">
                      <Label htmlFor="ano" className="form-label">
                        Ano
                      </Label>
                      <SelectListControlled<GastosPorCategoriaSearch>
                        field="ano"
                        control={control}
                        options={optAnos}
                      />
                    </div>
                  </Col>
                  <Col xs={12}>
                    <button type="button" className="btn btn-success" onClick={handleAplicar}>
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

export default GastosPorCategoriaHeader
