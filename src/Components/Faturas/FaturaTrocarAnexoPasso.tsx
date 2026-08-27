import React, { useEffect, useRef, useState } from 'react'
import { Button, Input, Spinner } from 'reactstrap'
import { FATURA_FILE_ACCEPT, isValidFaturaFile } from 'helpers/fatura_helpers'
import {
    arquivoTrocaEhPdf,
    formatTamanhoArquivo,
    primeirasLinhasCsv,
} from 'helpers/fatura_anexo_remover_helpers'

export type FaturaTrocarAnexoPassoProps = {
    file: File | null
    disabled?: boolean
    onFile: (file: File) => void
}

const FaturaTrocarAnexoPasso = ({
    file,
    disabled = false,
    onFile,
}: FaturaTrocarAnexoPassoProps) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [dragOver, setDragOver] = useState(false)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [csvPreview, setCsvPreview] = useState<string | null>(null)
    const [csvLoading, setCsvLoading] = useState(false)
    const [fileError, setFileError] = useState<string | null>(null)

    useEffect(() => {
        if (!file || !arquivoTrocaEhPdf(file)) {
            setPdfUrl(null)
            return
        }
        const url = URL.createObjectURL(file)
        setPdfUrl(url)
        return () => {
            URL.revokeObjectURL(url)
        }
    }, [file])

    useEffect(() => {
        if (!file || arquivoTrocaEhPdf(file)) {
            setCsvPreview(null)
            setCsvLoading(false)
            return
        }
        setCsvLoading(true)
        const reader = new FileReader()
        reader.onload = () => {
            setCsvPreview(primeirasLinhasCsv(String(reader.result || '')))
            setCsvLoading(false)
        }
        reader.onerror = () => {
            setCsvPreview(null)
            setCsvLoading(false)
        }
        reader.readAsText(file)
        return () => {
            reader.abort()
        }
    }, [file])

    const escolher = (chosen: File | undefined | null) => {
        if (!chosen) return
        if (!isValidFaturaFile(chosen)) {
            setFileError('Formato inválido. Envie PDF ou CSV.')
            return
        }
        setFileError(null)
        onFile(chosen)
    }

    const isPdf = file ? arquivoTrocaEhPdf(file) : false

    return (
        <div>
            <p className="text-muted mb-3">
                Escolha o arquivo certo desta competência e confira no preview antes de substituir.
            </p>
            <Input
                innerRef={inputRef}
                type="file"
                accept={FATURA_FILE_ACCEPT}
                className="d-none"
                disabled={disabled}
                onChange={(e) => escolher(e.target.files?.[0] ?? null)}
            />

            {!file ? (
                <button
                    type="button"
                    disabled={disabled}
                    className={`w-100 border rounded p-4 text-center bg-transparent ${
                        dragOver ? 'border-primary bg-primary-subtle' : 'border-dashed'
                    }`}
                    style={{ borderStyle: 'dashed' }}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault()
                        setDragOver(true)
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault()
                        setDragOver(false)
                        escolher(e.dataTransfer.files?.[0] ?? null)
                    }}
                >
                    <i className="ri-upload-2-line fs-3 d-block mb-2"></i>
                    <span className="fw-semibold d-block">Selecionar PDF ou CSV</span>
                    <span className="small text-muted">Escolha o arquivo para visualizar</span>
                </button>
            ) : (
                <>
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <div>
                            <div className="fw-semibold">{file.name}</div>
                            <div className="small text-muted">
                                {formatTamanhoArquivo(file.size)}
                                {file.type ? ` · ${file.type}` : ''}
                            </div>
                        </div>
                        <Button
                            type="button"
                            color="light"
                            size="sm"
                            className="border"
                            disabled={disabled}
                            onClick={() => {
                                if (inputRef.current) inputRef.current.value = ''
                                inputRef.current?.click()
                            }}
                        >
                            Escolher outro arquivo
                        </Button>
                    </div>
                    {isPdf ? (
                        pdfUrl ? (
                            <iframe
                                src={pdfUrl}
                                title="Preview do PDF novo"
                                style={{ width: '100%', height: '60vh', border: '1px solid #dee2e6' }}
                            />
                        ) : (
                            <div className="text-muted">Escolha o arquivo para visualizar</div>
                        )
                    ) : csvLoading ? (
                        <div className="text-center py-4">
                            <Spinner size="sm" className="me-2" />
                            Lendo CSV…
                        </div>
                    ) : (
                        <pre
                            className="bg-light border rounded p-3 mb-0 small"
                            style={{ maxHeight: '60vh', overflow: 'auto' }}
                        >
                            {csvPreview || 'Não foi possível ler o CSV.'}
                        </pre>
                    )}
                </>
            )}
            {fileError && <div className="text-danger small mt-2">{fileError}</div>}
        </div>
    )
}

export default FaturaTrocarAnexoPasso
