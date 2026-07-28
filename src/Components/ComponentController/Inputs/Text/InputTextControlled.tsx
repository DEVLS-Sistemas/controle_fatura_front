import { FieldValues, Path, Controller, Control, ValidationRule } from "react-hook-form"
import { InputText } from "./InputText"
import { ValidatorForm } from "../../ValidatorForm/ValidatorForm"
import { mask, maskOptions, removeMask } from "helpers/functions_helpers"
interface InputTextControlledProps<T extends FieldValues> {
    field: Path<T>
    label?: string
    type?: string
    value?: string | number 
    required?: ValidatorForm
    pattern?: ValidationRule<RegExp> | undefined
    errors?: any
    minLength?: ValidatorForm
    maxLength?: ValidatorForm
    placeholder?: string
    disabled?: boolean
    mask?: maskOptions,
    readOnly?: boolean,
    onChange?: (e: EventTarget) => void
    onKeyUp?: ((e: any) => void) | ((e: any) => Promise<void>)
    onBlur?: ((e: any) => void) | ((e: any) => Promise<void>),
    control: Control<T>,
    defaultValue?: any
    uppercase?: boolean
}


export const InputTextControlled = <T extends Partial<Record<keyof T, any>>>(props: InputTextControlledProps<T>) => {

    const onChangeWithMask = (e: any) => {
        const { value } = e.target
        let result = !!props.mask ? removeMask(value) : value
        if (props.uppercase && typeof result === 'string') {
            result = result.toUpperCase()
        }
        return result
    }
    const setValue = (v: any): any => {  // Alterando o tipo de retorno para `any`
        if (props.mask) {
            const maskedValue = mask(props.mask, v);
            return maskedValue !== undefined ? maskedValue : v;
        }
        if (props.uppercase && typeof v === 'string') {
            return v.toUpperCase()
        }
        return v;
    }
    
    return (
        <Controller
            name={props.field}
            control={props.control}
            defaultValue={props.defaultValue} 
            rules={{ required: props.required, minLength: props.minLength, maxLength: props.maxLength, pattern: props.pattern }}
            render={({ field }) => (
                <InputText
                    field={props.field}
                    required={!!props.required}
                    onBlur={props.onBlur}
                    onChange={(e: any) => field.onChange(onChangeWithMask(e))}
                    errors={props.errors}
                    placeholder={props.placeholder}
                    label={props.label}
                    type={props.type}
                    value={setValue(field.value)}
                    disabled={props.disabled}
                    readOnly={props.readOnly}
                    onKeyUp={props.onKeyUp}
                    uppercase={props.uppercase}
                />
            )}

        />
    )
}

