import { ValidatorForm } from "Components/ComponentController/ValidatorForm/ValidatorForm"
import { FieldValues, Path, UseFormRegister } from "react-hook-form"

interface InputNumberProps<T extends FieldValues> {
    field: Path<T>
    label?: string
    value?: string | number
    disabled?: boolean,
    required?: ValidatorForm
    pattern?: string
    errors?: any
    register: UseFormRegister<T>
    minLength?: ValidatorForm
    maxLength?: ValidatorForm
    mask?: void
    onlyPositive?: boolean
    step?: string | number
}

export const InputNumber = <T extends FieldValues>({ field, label, value, onlyPositive, disabled, required, minLength, maxLength, errors, register, mask, step }: InputNumberProps<T>) => {
    return (
        
            <input
                disabled={disabled}
                id={`number-input-${field}`}
                type='number'
                className={`form-control ${errors ? 'is-invalid' : ''}`}                
                {...onlyPositive ? { min: 0 } : {}}
                {...(step != null ? { step } : {})}
                {...register(field, { required: !disabled ? required : undefined, minLength, maxLength })}
                defaultValue={!value ? undefined : value}
            />
        
    )
}
