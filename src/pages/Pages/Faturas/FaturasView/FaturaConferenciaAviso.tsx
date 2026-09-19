import React from 'react'
import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import {
    FaturaConferencia,
    valoresConferenciaFatura,
} from 'helpers/fatura_conferencia_helpers'

interface FaturaConferenciaAvisoProps {
    conferencia?: FaturaConferencia | null
}

const FaturaConferenciaAviso = ({ conferencia }: FaturaConferenciaAvisoProps) => {
    const valores = valoresConferenciaFatura(conferencia)
    if (!valores) return null

    return (
        <div
            className="mt-3 p-3 rounded text-start"
            style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #93c5fd',
            }}
        >
            <div className="d-flex align-items-start gap-2">
                <i className="ri-information-line fs-18 mt-1" style={{ color: '#2563eb' }}></i>
                <div>
                    <div className="fw-semibold">Conferência do PDF</div>
                    <div className={`small mb-0 ${VALOR_TEXT_CLASS}`}>
                        Total no PDF: {formatCurrency(valores.valorCabecalho)}
                    </div>
                    <div className={`small mb-0 ${VALOR_TEXT_CLASS}`}>
                        Soma das linhas: {formatCurrency(valores.somaTransacoes)}
                    </div>
                    {valores.diferenca != null && (
                        <div className={`small mb-0 ${VALOR_TEXT_CLASS}`}>
                            Diferença: {formatCurrency(valores.diferenca)}
                        </div>
                    )}
                    <div className="small text-muted mb-0 mt-1">
                        O total da fatura continua o do PDF. A diferença pode ser um lançamento
                        que ainda não foi lido (ex.: crédito rotativo).
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FaturaConferenciaAviso
