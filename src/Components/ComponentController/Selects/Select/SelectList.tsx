import { SelectOptions, SelectProps } from 'interfaces/SystemInterfaces/SelectInterface';
import Select, { FormatOptionLabelMeta } from 'react-select'
import { BandeiraChip, CartaoChip } from 'helpers/cartao_helpers'

const customStyles = {
    multiValue: (styles: any) => {
        return {
            ...styles,
            backgroundColor: "#3762ea",
        };
    },
    multiValueLabel: (styles: any) => ({
        ...styles,
        backgroundColor: "#405189",
        color: "white",
    }),
    multiValueRemove: (styles: any) => ({
        ...styles,
        color: "white",
        backgroundColor: "#405189",
        ':hover': {
            backgroundColor: "#405189",
            color: 'white',
        },
    }),
}

const formatOptionLabel = (
    option: SelectOptions,
    _meta: FormatOptionLabelMeta<SelectOptions>
) => (
    <div className="d-flex align-items-center gap-2">
        {option.cor_principal ? (
            <BandeiraChip
                cor_principal={option.cor_principal}
                cor_secundaria={option.cor_secundaria}
            />
        ) : option.cor_fundo ? (
            <CartaoChip
                cor_fundo={option.cor_fundo}
                cor_texto={option.cor_texto}
                label={option.label ? String(option.label).slice(0, 1) : '•'}
                className="fs-12"
            />
        ) : option.cor ? (
            <span
                className="d-inline-block rounded-circle border flex-shrink-0"
                style={{
                    width: 12,
                    height: 12,
                    backgroundColor: option.cor,
                }}
            />
        ) : null}
        <span className="d-inline-flex align-items-baseline flex-wrap">
            <span>{option.label}</span>
            {option.subtitulo ? (
                <span
                    className="fw-normal ms-1"
                    style={{ fontSize: '0.92em', color: 'inherit', opacity: 0.72 }}
                >
                    - {option.subtitulo}
                </span>
            ) : null}
        </span>
    </div>
)

const filterOption = (
    option: { label?: string; data?: SelectOptions },
    input: string
) => {
    const q = String(input || '').trim().toLowerCase()
    if (!q) return true
    const haystack = [option.label, option.data?.subtitulo]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
    return haystack.includes(q)
}

const invalidControlStyles = {
    control: (styles: any) => ({
        ...styles,
        borderColor: '#dc3545',
        boxShadow: '0 0 0 0.2rem rgba(220, 53, 69, 0.25)',
        '&:hover': {
            borderColor: '#dc3545',
        },
    }),
}

export function SelectList(props: SelectProps) {
    const hasColorOptions = props.options.some(
        (option) => !!option.cor_principal || !!option.cor_fundo || !!option.cor
    )
    const hasSubtitulo = props.options.some((option) => !!option.subtitulo)
    const useCustomOptionLabel = hasColorOptions || hasSubtitulo
    const selectStyles = props.errors
        ? { ...customStyles, ...invalidControlStyles }
        : customStyles

    if (!props.isMulti) {
        const value = props.options.filter(
            (option) =>
                option.value != null &&
                props.value != null &&
                props.value !== '' &&
                String(option.value) === String(props.value)
        )
        return (
            <>
                <Select
                    placeholder={props.placeholder ?? "Selecione"}
                    styles={selectStyles}
                    options={props.options}
                    value={value}
                    onChange={(e: any) => props.onChange(e && e.value)}
                    onMenuOpen={() => props.onMenuOpen}
                    onMenuClose={() => props.onMenuClose}
                    isLoading={props.isLoading}
                    isDisabled={props.isDisabled}
                    name={props.name}
                    menuPlacement={props.menuPlacement ?? 'auto'}
                    isClearable
                    closeMenuOnSelect={true}
                    formatOptionLabel={useCustomOptionLabel ? formatOptionLabel : undefined}
                    filterOption={hasSubtitulo ? filterOption : undefined}
                    className={`${props.errors ? 'select is-invalid' : ''}`}
                />
                {props.errors && <div className="d-block invalid-feedback text-danger ps-3">{props.errors.message}</div>}
            </>
        )
    }

    const selectedValues = Array.isArray(props.value) ? props.value : []
    const selectedOptions = props.options.filter((option) =>
        selectedValues.some((v: any) => String(v) === String(option.value))
    )

    return (
        <>
            <Select
                className={`${props.errors ? 'select is-invalid' : ''}`}
                placeholder="Selecione"
                value={selectedOptions}
                isMulti={true}
                isClearable={true}
                isDisabled={props.isDisabled}
                isLoading={props.isLoading}
                onChange={(selected: any) => {
                    const values = selected ? selected.map((item: any) => item.value) : []
                    props.onChange(values)
                }}
                name={props.name}
                options={props.options}
                styles={selectStyles}
                closeMenuOnSelect={props.closeMenuOnSelect ?? false}
                menuPlacement={props.menuPlacement ?? 'auto'}
                formatOptionLabel={useCustomOptionLabel ? formatOptionLabel : undefined}
                filterOption={hasSubtitulo ? filterOption : undefined}
            />
            {props.errors && <div className="d-block invalid-feedback text-danger ps-3">{props.errors.message}</div>}
        </>
    )
}
