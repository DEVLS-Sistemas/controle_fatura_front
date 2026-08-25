import React, { forwardRef, useEffect, useImperativeHandle } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Breadcrumb, BreadcrumbItem, Card, CardHeader, Col, Label, Row } from 'reactstrap'
import UiContent from 'Components/Common/UiContent'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
  AssinaturaStatusFiltro,
  AssinaturasDefaultValues,
  AssinaturasSearch,
} from 'interfaces/Assinaturas/AssinaturasInterface'

export interface AssinaturasFilterHandle {
  setStatus: (status: AssinaturaStatusFiltro) => void
}

export interface AssinaturasFilterProps {
  getRemoteAssinaturas: (data: AssinaturasSearch) => void
  defaultValues?: AssinaturasSearch
  ordenarOptions: SelectOptions[]
  periodicidadeOptions: SelectOptions[]
  cartoesOptions: SelectOptions[]
  categoriasOptions: SelectOptions[]
  responsaveisOptions: SelectOptions[]
}

const AssinaturasFilter = forwardRef<AssinaturasFilterHandle, AssinaturasFilterProps>(({
  getRemoteAssinaturas,
  defaultValues = AssinaturasDefaultValues,
  ordenarOptions,
  periodicidadeOptions,
  cartoesOptions,
  categoriasOptions,
  responsaveisOptions,
}, ref) => {
  const { handleSubmit, control, watch, setValue } = useForm<AssinaturasSearch>({
    defaultValues,
  })

  const statusWatch = watch('status')
  const ordenarWatch = watch('ordenar')
  const periodicidadeWatch = watch('periodicidade')
  const cartaoWatch = watch('cartao_id')
  const responsavelWatch = watch('responsavel_id')
  const categoriaWatch = watch('categoria_id')
  const verIgnoradas = (statusWatch || 'todas') === 'ignorada'

  useImperativeHandle(ref, () => ({
    setStatus: (status: AssinaturaStatusFiltro) => {
      setValue('status', status)
    },
  }))

  useEffect(() => {
    handleSubmit(getRemoteAssinaturas)()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusWatch, ordenarWatch, periodicidadeWatch, cartaoWatch, responsavelWatch, categoriaWatch])

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
                <h4 className="mb-0">Assinaturas</h4>
                <p className="text-muted mb-0 fs-13">
                  Confirme as sugestões ou marque na própria compra
                </p>
              </div>
            </div>
            <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-2">
              <button
                type="button"
                className={`btn btn-sm ${verIgnoradas ? 'btn-secondary' : 'btn-soft-secondary'}`}
                onClick={() => setValue('status', verIgnoradas ? 'todas' : 'ignorada')}
              >
                <i className="ri-eye-off-line align-middle me-1"></i>
                {verIgnoradas ? 'Voltar à lista' : 'Ignoradas'}
              </button>
              <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                <BreadcrumbItem>
                  <Link to="/dashboard">
                    <i className="ri-home-5-fill"></i>
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbItem active>Assinaturas</BreadcrumbItem>
              </Breadcrumb>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col xl={12}>
          <Card className="position-relative" style={{ zIndex: 10 }}>
            <CardHeader>
              <form id="form-search-assinaturas" onSubmit={handleSubmit(getRemoteAssinaturas)}>
                <Row className="align-items-end g-3">
                  <Col lg={4} md={6}>
                    <div className="mb-0">
                      <Label htmlFor="palavra_chave" className="form-label">
                        Busca
                      </Label>
                      <InputTextControlled<AssinaturasSearch>
                        field="palavra_chave"
                        control={control}
                        placeholder="Netflix, Spotify, estabelecimento..."
                      />
                    </div>
                  </Col>
                  <Col lg={3} md={6}>
                    <div className="mb-0">
                      <Label htmlFor="ordenar" className="form-label">
                        Ordenar
                      </Label>
                      <SelectListControlled<AssinaturasSearch>
                        field="ordenar"
                        control={control}
                        options={ordenarOptions}
                      />
                    </div>
                  </Col>
                  <Col lg={3} md={6}>
                    <div className="mb-0">
                      <Label htmlFor="periodicidade" className="form-label">
                        Periodicidade
                      </Label>
                      <SelectListControlled<AssinaturasSearch>
                        field="periodicidade"
                        control={control}
                        options={periodicidadeOptions}
                      />
                    </div>
                  </Col>
                  <Col lg={2} md={6}>
                    <button className="btn btn-success w-100" type="submit">
                      <i className="ri-search-line align-middle me-1"></i> Buscar
                    </button>
                  </Col>
                </Row>

                <Row className="align-items-end g-3 mt-1">
                  <Col lg={4} md={4} sm={6}>
                    <div className="mb-0">
                      <Label htmlFor="cartao_id" className="form-label">
                        Cartão
                      </Label>
                      <SelectListControlled<AssinaturasSearch>
                        field="cartao_id"
                        control={control}
                        options={cartoesOptions}
                      />
                    </div>
                  </Col>
                  <Col lg={4} md={4} sm={6}>
                    <div className="mb-0">
                      <Label htmlFor="responsavel_id" className="form-label">
                        Responsável
                      </Label>
                      <SelectListControlled<AssinaturasSearch>
                        field="responsavel_id"
                        control={control}
                        options={responsaveisOptions}
                      />
                    </div>
                  </Col>
                  <Col lg={4} md={4} sm={6}>
                    <div className="mb-0">
                      <Label htmlFor="categoria_id" className="form-label">
                        Categoria
                      </Label>
                      <SelectListControlled<AssinaturasSearch>
                        field="categoria_id"
                        control={control}
                        options={categoriasOptions}
                      />
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

AssinaturasFilter.displayName = 'AssinaturasFilter'

export default AssinaturasFilter
