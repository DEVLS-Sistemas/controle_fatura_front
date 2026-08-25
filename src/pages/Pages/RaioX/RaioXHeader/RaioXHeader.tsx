import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Breadcrumb, BreadcrumbItem, Col, Collapse, Label, Row } from 'reactstrap'
import UiContent from 'Components/Common/UiContent'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { RaioXSearch } from 'interfaces/RaioX/RaioXInterface'
import { AnosSelect } from 'helpers/functions_helpers'
import { MESES_EXTENSO, SUBTITULO_RAIO_X } from 'helpers/raio_x_helpers'

type Props = {
  defaultValues: RaioXSearch
  responsaveisOptions: SelectOptions[]
  onChange: (filters: RaioXSearch) => void
}

const optMeses: SelectOptions[] = MESES_EXTENSO.map((label, i) => ({
  value: i + 1,
  label,
}))

const optAnos = AnosSelect({ anosFuturos: 2 })

const RaioXHeader = ({ defaultValues, responsaveisOptions, onChange }: Props) => {
  const { control, watch, getValues } = useForm<RaioXSearch>({
    defaultValues,
  })
  const [showMore, setShowMore] = useState(Boolean(defaultValues.responsavel_id))

  const emit = (patch: Partial<RaioXSearch>) => {
    const current = getValues()
    onChange({
      mes: Number(patch.mes ?? current.mes),
      ano: Number(patch.ano ?? current.ano),
      responsavel_id: patch.responsavel_id !== undefined ? patch.responsavel_id : current.responsavel_id,
    })
  }

  const mesWatch = watch('mes')
  const anoWatch = watch('ano')

  useEffect(() => {
    if (mesWatch && anoWatch) {
      emit({ mes: Number(mesWatch), ano: Number(anoWatch) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesWatch, anoWatch])

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
                <h1 className="mb-0 fs-4">Raio-X Financeiro</h1>
                <p className="text-muted mb-0 fs-13">{SUBTITULO_RAIO_X}</p>
              </div>
            </div>
            <div className="d-flex flex-column flex-sm-row align-items-sm-end gap-2 mt-3 mt-sm-0">
              <div style={{ minWidth: 160 }}>
                <Label className="form-label mb-1">Mês</Label>
                <SelectListControlled<RaioXSearch> field="mes" control={control} options={optMeses} />
              </div>
              <div style={{ minWidth: 110 }}>
                <Label className="form-label mb-1">Ano</Label>
                <SelectListControlled<RaioXSearch> field="ano" control={control} options={optAnos} />
              </div>
              <button
                type="button"
                className={`btn btn-sm ${showMore ? 'btn-secondary' : 'btn-soft-secondary'}`}
                onClick={() => setShowMore((open) => !open)}
              >
                <i className="ri-filter-3-line align-middle me-1"></i>
                Mais
              </button>
              <Breadcrumb pageTitle="" listClassName="mb-0 pt-1 py-2">
                <BreadcrumbItem>
                  <Link to="/dashboard">
                    <i className="ri-home-5-fill"></i>
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbItem active>Raio-X</BreadcrumbItem>
              </Breadcrumb>
            </div>
          </div>
        </Col>
      </Row>

      <Collapse isOpen={showMore}>
        <Row className="mb-3">
          <Col md={6} lg={4}>
            <Label className="form-label">Responsável</Label>
            <SelectListControlled<RaioXSearch>
              field="responsavel_id"
              control={control}
              options={responsaveisOptions}
            />
          </Col>
          <Col md={4} lg={2} className="d-flex align-items-end">
            <button
              type="button"
              className="btn btn-success w-100"
              onClick={() => emit({ responsavel_id: getValues('responsavel_id') || null })}
            >
              Aplicar
            </button>
          </Col>
        </Row>
      </Collapse>
    </React.Fragment>
  )
}

export default RaioXHeader
