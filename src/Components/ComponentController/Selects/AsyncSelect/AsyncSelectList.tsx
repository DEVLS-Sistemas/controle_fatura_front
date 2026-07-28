import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface';
import { useEffect, useRef } from 'react';

import AsyncSelect from 'react-select/async';
import { GroupBase } from 'react-select';
import './AsyncSelecStyle.css';


export interface AsyncSelectListInterface {
    callback: (inputValue: string) => Promise<SelectOptions[]>
    onChange: (...event: any[]) => void
    placeholder: string
    className: string
    style: string
    errors: any
    required?: boolean
    disabled?: boolean
    defaultValue?: SelectOptions
    isLoading?: boolean
    defaultOptions?: SelectOptions[]
    value?: SelectOptions
}

const customStyles = {
    container: (provided: any) => ({
        ...provided,
        width: '100%',  // Remover o !important
        display: 'flex',
    }),
    control: (provided: any, state: any) => ({
        ...provided,
        width: '100%',
        minWidth: 0,
        borderColor: state.selectProps.errors ? '#dc3545' : provided.borderColor,
        boxShadow: state.selectProps.errors ? '0 0 0 0.2rem rgba(220, 53, 69, 0.25)' : provided.boxShadow,
        '&:hover': {
            borderColor: state.selectProps.errors ? '#dc3545' : provided.borderColor,
        }
    }),
    singleValue: (provided: any) => ({
        ...provided,
        display: 'block',
    }),
    placeholder: (provided: any) => ({
        ...provided,
        width: '100%',
    }),
    dropdownIndicator: (provided: any) => ({
        ...provided,
        padding: '0 8px',
    }),
    multiValue: (styles: any) => ({
        ...styles,
        backgroundColor: "#3762ea",
        width: '100%',
    }),
    multiValueLabel: (styles: any) => ({
        ...styles,
        backgroundColor: "#405189",
        color: "white",
        width: '100%',
    }),
    multiValueRemove: (styles: any) => ({
        ...styles,
        color: "white",
        width: '100%',
        backgroundColor: "#405189",
        ':hover': {
            backgroundColor: "#405189",
            color: 'white',
        },
    }),
}


export const AsyncSelectList = (props: AsyncSelectListInterface) => {
    const myRef = useRef<any>(null)
    const callback = (inputValue: string) => {
        if (inputValue.length > 2) {
            return props.callback(inputValue)
        }
    }

    useEffect(() => {
        if (!props.value && myRef.current) {
            myRef.current.clearValue()
        }
    }, [props.value])

    // Estilos condicionais baseados na validação
    const conditionalStyles = {
        ...customStyles,
        control: (provided: any, state: any) => ({
            ...provided,
            width: '100%',
            minWidth: 0,
            borderColor: props.errors ? '#dc3545' : provided.borderColor,
            boxShadow: props.errors ? '0 0 0 0.2rem rgba(220, 53, 69, 0.25)' : provided.boxShadow,
            '&:hover': {
                borderColor: props.errors ? '#dc3545' : provided.borderColor,
            }
        }),
    }

    return (
        <>
            <div style={{ width: '100%' }}>
                <AsyncSelect
                    ref={myRef}
                    defaultValue={props.defaultValue}
                    isClearable={true}
                    defaultOptions={props.defaultOptions}
                    placeholder={props.placeholder}
                    styles={conditionalStyles}
                    isDisabled={props.disabled}
                    loadOptions={callback}
                    onChange={(e: any) => props.onChange(e && e.value)}
                    className="react-select-container"
                    getOptionLabel={(option) => option.label}
                    getOptionValue={(option) => option.value}
                />
            </div>
            {props.errors && <div className="text-danger">{props.errors.message}</div>}
        </>
    );
}

