import React, { useRef, useState } from 'react'
import { Button, Card, CardBody, CardHeader, Input, Label } from 'reactstrap'
import { toast } from 'react-toastify'
import { formatDateBr } from 'helpers/fatura_helpers'
import {
  ANEXO_ACCEPT,
  ANEXO_MAX_BYTES,
  ANEXO_TIPO_LABEL,
  formatTamanhoAnexo,
  identificadorDaCompra,
} from 'helpers/cadastro_manual_compra_helpers'
import { isFilenameFallbackPorId, primeiroNomeArquivoUtil } from 'helpers/anexo_filename_helpers'
import { CompraAnexoView, CompraVisualizacaoView } from 'interfaces/CompraVisualizacao/CompraVisualizacaoInterface'
import { TransacoesService } from 'services/Transacoes/TransacoesService'

interface CompraVisualizacaoAnexosProps {
  compra: CompraVisualizacaoView
  onChanged: () => void | Promise<void>
}

const CompraVisualizacaoAnexos = ({ compra, onChanged }: CompraVisualizacaoAnexosProps) => {
  const [uploading, setUploading] = useState(false)
  const [tipo, setTipo] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const transacoesService = new TransacoesService()
  const identificador = identificadorDaCompra(compra)
  const anexos: CompraAnexoView[] = compra.anexos ?? []

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !identificador) return
    const list = Array.from(files)
    const invalid = list.find((f) => f.size > ANEXO_MAX_BYTES)
    if (invalid) {
      toast.warning('Cada arquivo pode ter no máximo 10 MB')
      return
    }
    setUploading(true)
    try {
      await transacoesService.uploadAnexosTransacao({
        identificador,
        transacao_id: compra.transacao_id ?? undefined,
        arquivos: list,
        tipo: tipo || undefined,
      })
      toast.success(list.length > 1 ? 'Anexos enviados' : 'Anexo enviado')
      if (inputRef.current) inputRef.current.value = ''
      await onChanged()
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar anexo')
    } finally {
      setUploading(false)
    }
  }

  const abrir = async (anexo: CompraAnexoView) => {
    try {
      const { blob, filename } = await transacoesService.downloadAnexoTransacao(anexo.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.download = primeiroNomeArquivoUtil(
        isFilenameFallbackPorId(filename) ? null : filename,
        anexo.nome_original,
        anexo.nome,
        filename,
      ) || 'anexo'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 30_000)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao abrir anexo')
    }
  }

  const excluir = async (anexo: CompraAnexoView) => {
    if (!window.confirm('Excluir este anexo?')) return
    try {
      await transacoesService.deleteAnexoTransacao(anexo.id)
      toast.success('Anexo excluído')
      await onChanged()
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir anexo')
    }
  }

  return (
    <Card className="mb-3">
      <CardHeader>
        <h5 className="card-title mb-0">Anexos</h5>
      </CardHeader>
      <CardBody>
        {anexos.length === 0 ? (
          <p className="text-muted">Nenhum anexo nesta compra.</p>
        ) : (
          <div className="table-responsive mb-3">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Arquivo</th>
                  <th>Tipo</th>
                  <th>Tamanho</th>
                  <th>Data</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {anexos.map((anexo) => (
                  <tr key={anexo.id}>
                    <td>{primeiroNomeArquivoUtil(anexo.nome_original, anexo.nome) || 'Anexo'}</td>
                    <td>{ANEXO_TIPO_LABEL[anexo.tipo || ''] || anexo.tipo || '—'}</td>
                    <td>{formatTamanhoAnexo(anexo.tamanho) || '—'}</td>
                    <td>{anexo.created_at ? formatDateBr(anexo.created_at) : '—'}</td>
                    <td className="text-end">
                      <Button color="soft-info" size="sm" className="me-1" onClick={() => abrir(anexo)}>
                        Abrir
                      </Button>
                      <Button color="soft-danger" size="sm" onClick={() => excluir(anexo)}>
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="d-flex flex-wrap align-items-end gap-2">
          <div>
            <Label className="form-label mb-1">Tipo</Label>
            <Input type="select" value={tipo} onChange={(e) => setTipo(e.target.value)} disabled={uploading}>
              <option value="">Automático</option>
              {Object.entries(ANEXO_TIPO_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Input>
          </div>
          <div>
            <Label className="form-label mb-1">Arquivos</Label>
            <Input
              innerRef={inputRef}
              type="file"
              accept={ANEXO_ACCEPT}
              multiple
              disabled={uploading || !identificador}
              onChange={(e) => handleFiles(e.target.files)}
            />
            <small className="text-muted d-block">PDF ou imagem, até 10 MB cada.</small>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default CompraVisualizacaoAnexos
