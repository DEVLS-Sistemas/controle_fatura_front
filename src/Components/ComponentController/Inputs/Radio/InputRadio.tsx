
import { ValidatorForm } from "Components/ComponentController/ValidatorForm/ValidatorForm"
import { FieldValues, Path, UseFormRegister } from "react-hook-form"
import { Label } from "reactstrap"

type OptionType = {
    value: number
    label: string
}

interface RadioInputProps<T extends FieldValues> {
    options?: OptionType[]
    required?: ValidatorForm
    field: Path<T>
    register: UseFormRegister<T>
    errors?: any
    minLength?: ValidatorForm
    maxLength?: ValidatorForm
    disabled?: boolean
}

export const InputRadio = <T extends Record<keyof T, any>>({ disabled, required, options = [], field, register, errors }: RadioInputProps<T>) => {
    const customSetValue = (value: any) => {
        return value && value.toString()
    }
    const isDisabled = disabled ? { backgroundColor: '#f1f1f1', opacity: 1 } : {}
    return (
        < >
            {
                options.map((option, index) => {
                    return (
                        <div
                            key={`radio-${index}`}
                            className="mb-2">
                            <Label className="form-check-label" htmlFor={`flexRadioDefault${index}`}>{option.label}</Label>
                            <input
                                disabled={disabled}
                                className="form-check-input"
                                id={`flexRadioDefault${index}`}
                                type="radio"
                                value={option.value}
                                {...register(field, { required: !disabled ? required : undefined, setValueAs: value => customSetValue(value) })}
                            />
                        </div>
                    )
                })
            }
        </>

    )
}
