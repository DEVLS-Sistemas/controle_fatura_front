import React from 'react'
import { Control, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { Col, Label, Row } from 'reactstrap'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { mesesOptions } from 'helpers/fatura_helpers'
import { AnosSelect } from 'helpers/functions_helpers'
import { PeriodoFiltro, PeriodoModo } from 'interfaces/Estatisticas/EstatisticasCompraInterface'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'

type PeriodoFiltroCamposProps = {
    control: Control<any>
    register: UseFormRegister<any>
    watch: UseFormWatch<any>
    setValue?: UseFormSetValue<any>
    idPrefix?: string
}

const MODOS: { value: PeriodoModo; label: string }[] = [
    { value: 'historico', label: 'Todo o histórico' },
    { value: 'mes', label: 'Mês' },
    { value: 'intervalo', label: 'Intervalo' },
]

const PeriodoFiltroCampos = ({
    control,
    register,
    watch,
    setValue,
    idPrefix = 'periodo',
}: PeriodoFiltroCamposProps) => {
    const modo = (watch('periodo_modo') ?? 'historico') as PeriodoModo
    const optMeses: SelectOptions[] = mesesOptions
    const optAnos = AnosSelect()

    const handleModo = (value: PeriodoModo) => {
        setValue?.('periodo_modo', value, { shouldDirty: true })
        if (value === 'mes') {
            const hoje = new Date()
            if (!watch('mes')) setValue?.('mes', hoje.getMonth() + 1, { shouldDirty: true })
            if (!watch('ano')) setValue?.('ano', hoje.getFullYear(), { shouldDirty: true })
        }
    }

    return (
        <div>
            <Label className="form-label">Período das compras</Label>
            <div className="d-flex flex-wrap gap-2 mb-3">
                {MODOS.map((item) => {
                    const inputId = `${idPrefix}-${item.value}`
                    return (
                        <div key={item.value}>
                            <input
                                type="radio"
                                className="btn-check"
                                name={`${idPrefix}-modo`}
                                id={inputId}
                                value={item.value}
                                checked={modo === item.value}
                                onChange={() => handleModo(item.value)}
                            />
                            <label className="btn btn-outline-primary btn-sm" htmlFor={inputId}>
                                {item.label}
                            </label>
                        </div>
                    )
                })}
            </div>

            {modo === 'mes' && (
                <Row>
                    <Col md={6} className="mb-3">
                        <Label className="form-label">Mês</Label>
                        <SelectListControlled<PeriodoFiltro>
                            options={optMeses}
                            field="mes"
                            control={control}
                        />
                    </Col>
                    <Col md={6} className="mb-3">
                        <Label className="form-label">Ano</Label>
                        <SelectListControlled<PeriodoFiltro>
                            options={optAnos}
                            field="ano"
                            control={control}
                        />
                    </Col>
                </Row>
            )}

            {modo === 'intervalo' && (
                <Row>
                    <Col md={6} className="mb-3">
                        <Label className="form-label" htmlFor={`${idPrefix}-data-inicio`}>De</Label>
                        <input
                            {...register('data_inicio')}
                            id={`${idPrefix}-data-inicio`}
                            type="date"
                            className="form-control"
                        />
                    </Col>
                    <Col md={6} className="mb-3">
                        <Label className="form-label" htmlFor={`${idPrefix}-data-fim`}>Até</Label>
                        <input
                            {...register('data_fim')}
                            id={`${idPrefix}-data-fim`}
                            type="date"
                            className="form-control"
                        />
                    </Col>
                </Row>
            )}
        </div>
    )
}

export default PeriodoFiltroCampos
