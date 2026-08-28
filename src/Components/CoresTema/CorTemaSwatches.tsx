import React from 'react'
import { UncontrolledTooltip } from 'reactstrap'
import { CategoriaTemaLookup } from 'interfaces/Categorias/CategoriasInterface'
import {
  corHexLegadoForaDaPaleta,
  hexesTemaIguais,
  normalizeHexTema,
} from 'helpers/cores_tema_helpers'

interface CorTemaSwatchesProps {
  temas: CategoriaTemaLookup[]
  value?: string | null
  onChange: (hex: string) => void
  extraHex?: string | null
  disabled?: boolean
  idPrefix?: string
  size?: number
}

const swatchId = (prefix: string, hex: string): string =>
  `${prefix}-${hex.replace('#', '')}`

const CorTemaQuadrado = ({
  hex,
  label,
  selected,
  disabled,
  id,
  size,
  onClick,
}: {
  hex: string
  label: string
  selected: boolean
  disabled?: boolean
  id: string
  size: number
  onClick: () => void
}) => (
  <>
    <button
      type="button"
      id={id}
      className={`cor-tema-swatches__btn${selected ? ' is-selected' : ''}`}
      aria-label={`${label} ${hex}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      style={{ width: size, height: size, backgroundColor: hex }}
    />
    <UncontrolledTooltip placement="top" target={id}>
      {hex}
    </UncontrolledTooltip>
  </>
)

const CorTemaSwatches = ({
  temas,
  value,
  onChange,
  extraHex,
  disabled,
  idPrefix = 'cor-tema',
  size = 24,
}: CorTemaSwatchesProps) => {
  const selecionado = normalizeHexTema(value)
  const legado = extraHex ?? corHexLegadoForaDaPaleta(value, temas)
  const itens: CategoriaTemaLookup[] = legado
    ? [...temas, { chave: 'legado', label: legado, hex: legado, padrao: false, variacoes: [] }]
    : temas

  return (
    <div className="cor-tema-swatches" role="group" aria-label="Cor tema">
      {itens.map((tema) => {
        const hex = normalizeHexTema(tema.hex) || tema.hex
        return (
          <CorTemaQuadrado
            key={`${tema.chave || hex}`}
            id={swatchId(idPrefix, hex)}
            hex={hex}
            label={tema.label || hex}
            selected={hexesTemaIguais(selecionado, hex)}
            disabled={disabled}
            size={size}
            onClick={() => onChange(hex)}
          />
        )
      })}
    </div>
  )
}

export default CorTemaSwatches

export const CorTemaPreview = ({
  hexes,
  idPrefix = 'cor-tema-preview',
  size = 22,
}: {
  hexes: string[]
  idPrefix?: string
  size?: number
}) => {
  if (!hexes.length) return null
  return (
    <div className="cor-tema-swatches" role="group" aria-label="Tons das subcategorias">
      {hexes.map((raw, index) => {
        const hex = normalizeHexTema(raw) || raw
        const id = `${idPrefix}-${index}-${hex.replace('#', '')}`
        return (
          <React.Fragment key={id}>
            <span
              id={id}
              className="cor-tema-swatches__preview"
              aria-label={hex}
              style={{ width: size, height: size, backgroundColor: hex }}
            />
            <UncontrolledTooltip placement="top" target={id}>
              {hex}
            </UncontrolledTooltip>
          </React.Fragment>
        )
      })}
    </div>
  )
}
