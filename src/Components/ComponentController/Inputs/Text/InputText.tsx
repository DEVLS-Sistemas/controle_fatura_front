import { FieldValues, Path } from "react-hook-form"
import { ValidatorForm } from "../../ValidatorForm/ValidatorForm"

interface InputTextProps<T extends FieldValues> {
    field?: Path<T>
    label?: string
    type?: string
    value: string | number
    required?: boolean
    pattern?: string
    errors?: any
    minLength?: ValidatorForm
    maxLength?: ValidatorForm
    placeholder?: string
    disabled?: boolean
    // mask?: maskOptions,
    readOnly?: boolean,
    onChange?: any,
    onBlur?: any,
    onKeyUp?: any,
    defaultValue?: any
    uppercase?: boolean
}

export const InputText = <T extends Record<keyof T, any>>(
    {
        field,
        label,
        type,
        disabled,
        readOnly,
        required,
        value,
        placeholder,
        errors,
        onChange,
        onBlur,
        onKeyUp,
        uppercase,
    }: InputTextProps<T>) => {
    return (
        <>
            <input
                onBlur={onBlur}
                disabled={!!disabled}
                readOnly={!!readOnly}
                placeholder={placeholder}
                required={!!required}
                id={`text-input-${field}`}
                type={`${type ? type : 'text'}`}
                className={`form-control ${errors ? 'is-invalid' : ''}`}
                value={value}
                onChange={onChange}
                onKeyUp={onKeyUp}
                style={uppercase ? { textTransform: 'uppercase' } : undefined}
            />
        </>
    )
}
