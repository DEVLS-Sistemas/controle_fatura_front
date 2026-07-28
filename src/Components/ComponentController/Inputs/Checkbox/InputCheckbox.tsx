import { ValidatorForm } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { FieldValues, UseFormRegister } from 'react-hook-form'
import { Path } from 'react-hook-form'
import { Input } from 'reactstrap'

export interface CheckboxInputProps<T extends FieldValues> {
    field: Path<T>
    value?: string | number | undefined
    disabled?: boolean,
    checked?: boolean,
    required?: ValidatorForm
    pattern?: string
    errors?: any
    register: UseFormRegister<T>
    minLength?: ValidatorForm
    maxLength?: ValidatorForm
    placeholder?: string
    role?: string
}

export const InputCheckbox = <T extends FieldValues>({ field, register, required, disabled, errors, placeholder,checked, role }: CheckboxInputProps<T>) => {
    return (
        <>
    {/* <div className="form-check form-switch form-check-right mb-2"> */}
            <input
                role={role} 
                placeholder={placeholder}
                id={field}
                type="checkbox"
                className='form-check-input me-2'
                disabled={disabled}
                checked={checked}
                {...register(field, { required })}
            />
        </>
    )
}
