import React, { forwardRef, useEffect, useImperativeHandle } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Breadcrumb, BreadcrumbItem, Card, CardHeader, Col, Label, Row } from 'reactstrap'
import UiContent from 'Components/Common/UiContent'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { InputCheckbox } from 'Components/ComponentController/Inputs/Checkbox/InputCheckbox'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { AnosSelect } from 'helpers/functions_helpers'
import { shiftMesAno } from 'helpers/ranking_parceladas_helpers'
import {
  RankingParceladasDefaultValues,
  RankingParceladasSearch,
  RankingParceladasVisualizacao,
} from 'interfaces/RankingParceladas/RankingParceladasInterface'

export const MESES_NOMES: SelectOptions[] = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

export const RankingParceladasOrdenarOptions: SelectOptions[] = [
  { value: 'restantes_desc', label: 'Ranking: parcelas, valor e %' },
  { value: 'restantes_asc', label: 'Quase no fim' },
  { value: 'percentual_asc', label: 'Menor % pago' },
  { value: 'percentual_desc', label: 'Maior % pago' },
  { value: 'valor_aberto_desc', label: 'Maior valor em aberto' },
  { value: 'data_compra_desc', label: 'Compra mais recente' },
]

export interface RankingParceladasFilterHandle {
  shiftCompetencia: (delta: number) => void
  goToday: () => void
}

export interface RankingParceladasFilterProps {
  getRemoteRankingParceladas: (data: RankingParceladasSearch) => void
  defaultValues?: RankingParceladasSearch
  cartoesOptions: SelectOptions[]
  categoriasOptions: SelectOptions[]
  responsaveisOptions: SelectOptions[]
  visualizacao: RankingParceladasVisualizacao
  onVisualizacaoChange: (view: RankingParceladasVisualizacao) => void
}

const RankingParceladasFilter = forwardRef<RankingParceladasFilterHandle, RankingParceladasFilterProps>(({
  getRemoteRankingParceladas,
  defaultValues = RankingParceladasDefaultValues,
  cartoesOptions,
  categoriasOptions,
  responsaveisOptions,
  visualizacao,
  onVisualizacaoChange,
}, ref) => {
  const { handleSubmit, control, register, watch, setValue, getValues } = useForm<RankingParceladasSearch>({
    defaultValues,
  })

  const mesWatch = watch('mes')
  const anoWatch = watch('ano')
  const cartaoWatch = watch('cartao_id')
  const responsavelWatch = watch('responsavel_id')
  const categoriaWatch = watch('categoria_id')
  const ordenarWatch = watch('ordenar')
  const apenasAbertasWatch = watch('apenas_abertas')

  useImperativeHandle(ref, () => ({
    shiftCompetencia: (delta: number) => {
      const mes = Number(getValues('mes')) || new Date().getMonth() + 1
      const ano = Number(getValues('ano')) || new Date().getFullYear()
      const next = shiftMesAno(mes, ano, delta)
      setValue('mes', next.mes)
      setValue('ano', next.ano)
    },
    goToday: () => {
      const now = new Date()
      setValue('mes', now.getMonth() + 1)
      setValue('ano', now.getFullYear())
    },
  }))

  useEffect(() => {
    if (mesWatch && anoWatch) {
      handleSubmit(getRemoteRankingParceladas)()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesWatch, anoWatch, cartaoWatch, responsavelWatch, categoriaWatch, ordenarWatch, apenasAbertasWatch])

  const optAnos = AnosSelect({ anosFuturos: 4 })

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
                <h4 className="mb-0">Compras parceladas</h4>
                <p className="text-muted mb-0 fs-13">
                  No topo: mais parcelas em aberto, maior valor e menor % pago. 100% sempre no final.
                </p>
              </div>
            </div>
            <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-2">
              <div className="btn-group" role="group" aria-label="Tipo de visualização">
                <button
                  type="button"
                  className={`btn btn-sm ${visualizacao === 'lista' ? 'btn-primary' : 'btn-soft-primary'}`}
                  onClick={() => onVisualizacaoChange('lista')}
                >
                  <i className="ri-list-check align-middle me-1"></i>
                  Lista
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${visualizacao === 'competencias' ? 'btn-primary' : 'btn-soft-primary'}`}
                  onClick={() => onVisualizacaoChange('competencias')}
                >
                  <i className="ri-calendar-line align-middle me-1"></i>
                  Por competências
                </button>
              </div>
              <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                <BreadcrumbItem>
                  <Link to="/dashboard">
                    <i className="ri-home-5-fill"></i>
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <Link to="/relatorios">Relatórios</Link>
                </BreadcrumbItem>
                <BreadcrumbItem active>Parceladas</BreadcrumbItem>
              </Breadcrumb>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col xl={12}>
          <Card className="position-relative" style={{ zIndex: 10 }}>
            <CardHeader>
              <form id="form-search-ranking-parceladas" onSubmit={handleSubmit(getRemoteRankingParceladas)}>
                <Row className="align-items-end g-3">
                  <Col lg={2} md={4} sm={6}>
                    <div className="mb-0">
                      <Label htmlFor="mes" className="form-label">
                        Mês
                      </Label>
                      <SelectListControlled<RankingParceladasSearch>
                        field="mes"
                        control={control}
                        options={MESES_NOMES}
                      />
                    </div>
                  </Col>
                  <Col lg={2} md={4} sm={6}>
                    <div className="mb-0">
                      <Label htmlFor="ano" className="form-label">
                        Ano
                      </Label>
                      <SelectListControlled<RankingParceladasSearch>
                        field="ano"
                        control={control}
                        options={optAnos}
                      />
                    </div>
                  </Col>
                  <Col lg={3} md={4} sm={6}>
                    <div className="mb-0">
                      <Label htmlFor="palavra_chave" className="form-label">
                        Busca
                      </Label>
                      <InputTextControlled<RankingParceladasSearch>
                        field="palavra_chave"
                        control={control}
                        placeholder="Observação ou estabelecimento"
                      />
                    </div>
                  </Col>
                  <Col lg={3} md={4} sm={6}>
                    <div className="mb-0">
                      <Label htmlFor="ordenar" className="form-label">
                        Ordenar
                      </Label>
                      <SelectListControlled<RankingParceladasSearch>
                        field="ordenar"
                        control={control}
                        options={RankingParceladasOrdenarOptions}
                      />
                    </div>
                  </Col>
                  <Col lg={2} md={4} sm={6}>
                    <button className="btn btn-success w-100" type="submit">
                      <i className="ri-search-line align-middle me-1"></i> Buscar
                    </button>
                  </Col>
                </Row>

                <Row className="align-items-end g-3 mt-1">
                  <Col lg={3} md={4} sm={6}>
                    <div className="mb-0">
                      <Label htmlFor="cartao_id" className="form-label">
                        Cartão
                      </Label>
                      <SelectListControlled<RankingParceladasSearch>
                        field="cartao_id"
                        control={control}
                        options={cartoesOptions}
                      />
                    </div>
                  </Col>
                  <Col lg={3} md={4} sm={6}>
                    <div className="mb-0">
                      <Label htmlFor="responsavel_id" className="form-label">
                        Responsável
                      </Label>
                      <SelectListControlled<RankingParceladasSearch>
                        field="responsavel_id"
                        control={control}
                        options={responsaveisOptions}
                      />
                    </div>
                  </Col>
                  <Col lg={3} md={4} sm={6}>
                    <div className="mb-0">
                      <Label htmlFor="categoria_id" className="form-label">
                        Categoria
                      </Label>
                      <SelectListControlled<RankingParceladasSearch>
                        field="categoria_id"
                        control={control}
                        options={categoriasOptions}
                      />
                    </div>
                  </Col>
                  <Col lg={3} md={4} sm={6}>
                    <div className="form-check form-switch mb-2">
                      <InputCheckbox<RankingParceladasSearch>
                        field="apenas_abertas"
                        register={register}
                        role="switch"
                      />
                      <Label className="form-check-label" htmlFor="apenas_abertas">
                        Só em aberto
                      </Label>
                      <div className="text-muted fs-12">
                        Inclui a última parcela deste mês; some se já acabou no mês anterior
                      </div>
                    </div>
                  </Col>
                </Row>
              </form>
            </CardHeader>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  )
})

RankingParceladasFilter.displayName = 'RankingParceladasFilter'

export default RankingParceladasFilter
