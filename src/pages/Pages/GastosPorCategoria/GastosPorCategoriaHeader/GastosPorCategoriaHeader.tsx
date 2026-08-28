import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Breadcrumb, BreadcrumbItem, Card, CardHeader, Col, Collapse, Label, Row } from 'reactstrap'
import UiContent from 'Components/Common/UiContent'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { AnosSelect, mesesSelect } from 'helpers/functions_helpers'
import {
  GASTOS_ANO_TODO,
  MESES_JANELA_OPCOES,
  isGastosAnoTodo,
  rotuloAnoCalendario,
  rotuloJanelaMeses,
  rotuloPeriodoFiltro,
} from 'helpers/gastos_por_categoria_helpers'
import {
  GastosPorCategoriaDefaultValues,
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
  const anoAtual = new Date().getFullYear()
  const { control, watch, setValue, getValues } = useForm<GastosPorCategoriaSearch>({
    defaultValues: {
      ...defaultValues,
      ano: defaultValues.ano ?? anoAtual,
      mes_inicio: defaultValues.mes_inicio ?? defaultValues.mes ?? null,
      mes_fim: defaultValues.mes_fim ?? defaultValues.mes ?? null,
    },
  })
  const hasAdvancedDefault = Boolean(defaultValues.cartao_id || defaultValues.responsavel_id)
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedDefault)

  const mesesWatch = watch('meses')
  const anoWatch = watch('ano')
  const mesInicioWatch = watch('mes_inicio')
  const mesFimWatch = watch('mes_fim')
  const mesInicioNumero = Number(mesInicioWatch)
  const hasMesInicioNumero = Number.isInteger(mesInicioNumero) && mesInicioNumero >= 1
  const usaCalendario = Boolean(anoWatch) && (isGastosAnoTodo(mesInicioWatch) || hasMesInicioNumero)
  const mesesAtivo = usaCalendario ? null : (Number(mesesWatch ?? 3) as 1 | 3 | 6)
  const anoChipAtivo = isGastosAnoTodo(mesInicioWatch)
  const intervalo =
    periodoInicio && periodoFim ? `${periodoInicio} → ${periodoFim}` : periodoInicio || periodoFim || null
  const periodoFiltro = rotuloPeriodoFiltro({
    meses: usaCalendario ? null : mesesWatch,
    ano: anoWatch,
    mes: defaultValues.mes,
    mes_inicio: mesInicioWatch,
    mes_fim: mesFimWatch,
  })
  const optAnos = AnosSelect()
  const optMesesDe: SelectOptions[] = [{ value: GASTOS_ANO_TODO, label: 'Ano todo' }, ...mesesSelect()]
  const optMesesAte = useMemo(() => {
    const inicio = Number(mesInicioWatch)
    if (!Number.isInteger(inicio) || inicio < 1) return mesesSelect()
    return mesesSelect().filter((opt) => Number(opt.value) >= inicio)
  }, [mesInicioWatch])
  const isAnoTodo = isGastosAnoTodo(mesInicioWatch)

  const emitChange = (patch: Partial<GastosPorCategoriaSearch>) => {
    const current = getValues()
    onChange({
      ...current,
      ...patch,
    })
  }

  const handleMeses = (meses: 1 | 3 | 6) => {
    setValue('meses', meses)
    setValue('mes', null)
    setValue('ano', anoAtual)
    setValue('mes_inicio', null)
    setValue('mes_fim', null)
    setValue('data_inicio', null)
    setValue('data_fim', null)
    emitChange({
      meses,
      mes: null,
      ano: null,
      mes_inicio: null,
      mes_fim: null,
      data_inicio: null,
      data_fim: null,
    })
  }

  const handleAnoCalendario = () => {
    const ano = Number(getValues('ano')) || anoAtual
    setValue('meses', null)
    setValue('mes', null)
    setValue('ano', ano)
    setValue('mes_inicio', GASTOS_ANO_TODO)
    setValue('mes_fim', null)
    setValue('data_inicio', null)
    setValue('data_fim', null)
    emitChange({
      meses: null,
      mes: null,
      ano,
      mes_inicio: GASTOS_ANO_TODO,
      mes_fim: null,
      data_inicio: null,
      data_fim: null,
    })
  }

  const handleCalendario = (patch: Partial<GastosPorCategoriaSearch>) => {
    const next = { ...getValues(), ...patch }
    const ano = Number(next.ano) || anoAtual
    setValue('ano', ano)
    if (patch.mes_inicio !== undefined) setValue('mes_inicio', patch.mes_inicio)
    if (patch.mes_fim !== undefined) setValue('mes_fim', patch.mes_fim)

    const mesInicio = patch.mes_inicio !== undefined ? patch.mes_inicio : next.mes_inicio
    if (isGastosAnoTodo(mesInicio)) {
      setValue('meses', null)
      setValue('mes', null)
      setValue('mes_fim', null)
      emitChange({
        meses: null,
        mes: null,
        ano,
        mes_inicio: GASTOS_ANO_TODO,
        mes_fim: null,
        data_inicio: null,
        data_fim: null,
      })
      return
    }

    const inicio = Number(mesInicio)
    if (!Number.isInteger(inicio) || inicio < 1) {
      if (patch.ano !== undefined) {
        setValue('meses', null)
        setValue('mes', null)
        setValue('mes_inicio', GASTOS_ANO_TODO)
        setValue('mes_fim', null)
        emitChange({
          meses: null,
          mes: null,
          ano,
          mes_inicio: GASTOS_ANO_TODO,
          mes_fim: null,
          data_inicio: null,
          data_fim: null,
        })
      }
      return
    }
    let fim = Number(patch.mes_fim !== undefined ? patch.mes_fim : next.mes_fim)
    if (!Number.isInteger(fim) || fim < inicio) fim = inicio
    setValue('mes_fim', fim)
    setValue('meses', null)
    setValue('mes', inicio === fim ? inicio : null)
    emitChange({
      meses: null,
      mes: inicio === fim ? inicio : null,
      ano,
      mes_inicio: inicio,
      mes_fim: fim,
      data_inicio: null,
      data_fim: null,
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
              <p className="text-uppercase fw-medium text-muted mb-2 fs-12">Período</p>
              <div className="gastos-periodo-atalhos" role="group" aria-label="Atalhos de período">
                {MESES_JANELA_OPCOES.map((opcao) => (
                  <button
                    key={opcao.value}
                    type="button"
                    className={`btn btn-sm text-start ${mesesAtivo === opcao.value ? 'btn-primary' : 'btn-soft-primary'}`}
                    onClick={() => handleMeses(opcao.value)}
                  >
                    <span className="d-block fw-semibold">{opcao.label}</span>
                    <span className={`d-block fs-11 ${mesesAtivo === opcao.value ? '' : 'text-muted'}`}>
                      {rotuloJanelaMeses(opcao.value)}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  className={`btn btn-sm text-start ${anoChipAtivo ? 'btn-primary' : 'btn-soft-primary'}`}
                  onClick={handleAnoCalendario}
                >
                  <span className="d-block fw-semibold">Ano {Number(anoWatch) || anoAtual}</span>
                  <span className={`d-block fs-11 ${anoChipAtivo ? '' : 'text-muted'}`}>
                    {rotuloAnoCalendario(Number(anoWatch) || anoAtual)}
                  </span>
                </button>
              </div>

              <p className="text-muted mb-2 fs-12">Ou escolha o intervalo (como no dashboard)</p>
              <Row className="g-2 align-items-end">
                <Col xs={12} sm={4} lg={2}>
                  <Label className="form-label mb-1">Ano</Label>
                  <SelectListControlled<GastosPorCategoriaSearch>
                    field="ano"
                    control={control}
                    options={optAnos}
                    onValueChange={(val) => handleCalendario({ ano: val ? Number(val) : anoAtual })}
                  />
                </Col>
                <Col xs={12} sm={4} lg={2}>
                  <Label className="form-label mb-1">De</Label>
                  <SelectListControlled<GastosPorCategoriaSearch>
                    field="mes_inicio"
                    control={control}
                    options={optMesesDe}
                    onValueChange={(val) => handleCalendario({ mes_inicio: val ?? GASTOS_ANO_TODO })}
                  />
                </Col>
                {hasMesInicioNumero && !isAnoTodo && (
                  <Col xs={12} sm={4} lg={2}>
                    <Label className="form-label mb-1">Até</Label>
                    <SelectListControlled<GastosPorCategoriaSearch>
                      field="mes_fim"
                      control={control}
                      options={optMesesAte}
                      onValueChange={(val) => handleCalendario({ mes_fim: val ? Number(val) : null })}
                    />
                  </Col>
                )}
              </Row>

              <div className="gastos-periodo-resumo mt-3" role="status">
                <strong className="d-block">{periodoFiltro.titulo}</strong>
                <span className="text-muted">{periodoFiltro.detalhe}</span>
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
                  <Col xs={12}>
                    <button
                      type="button"
                      className="btn btn-success"
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

export default GastosPorCategoriaHeader
