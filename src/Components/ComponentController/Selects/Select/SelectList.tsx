import { SelectProps } from 'interfaces/SystemInterfaces/SelectInterface';
import { useEffect, useState } from 'react';
import Select from 'react-select'

const customStyles = {
    multiValue: (styles: any, { data }: any) => {
        return {
            ...styles,
            backgroundColor: "#3762ea",
        };
    },
    multiValueLabel: (styles: any, { data }: any) => ({
        ...styles,
        backgroundColor: "#405189",
        color: "white",
    }),
    multiValueRemove: (styles: any, { data }: any) => ({
        ...styles,
        color: "white",
        backgroundColor: "#405189",
        ':hover': {
            backgroundColor: "#405189",
            color: 'white',
        },
    }),
}



export function SelectList(props: SelectProps) {
    const value = props.options.filter(option => option.value === props.value)
    const [selectedMulti2, setselectedMulti2] = useState<any>('');

    function handleMulti2(selectedMulti2: any) {
        setselectedMulti2(selectedMulti2);
    }

    return (
        <>
            {!props.isMulti ?
                <Select
                    placeholder="Selecione"
                    styles={customStyles}
                    options={props.options}
                    value={value}
                    onChange={(e: any) => props.onChange(
                        e && e.value
                    )}
                    onMenuOpen={() => props.onMenuOpen}
                    onMenuClose={() => props.onMenuClose}
                    isLoading={props.isLoading}
                    isDisabled={props.isDisabled}
                    name={props.name}
                    menuPlacement={'auto'}
                    isClearable=""
                    closeMenuOnSelect={true}
                    className={` ${props.errors ? 'select is-invalid' : ''}`}
                />
                :
                <Select
                    className={` ${props.errors ? 'select is-invalid' : ''}`}
                    placeholder="Selecione"
                    value={selectedMulti}
                    isMulti={true}
                    isClearable={true}
                    onChange={(selected: any) => {
                        const value = selected ? selected : [];
                        setSelectedMulti(value);
                        props.onChange(value);
                    }}
                    name={props.name}
                    options={props.options}
                    styles={customStyles}
                    closeMenuOnSelect={false}
                />
            }
            {props.errors && <div className="d-block invalid-feedback text-danger ps-3">{props.errors.message}</div>}
        </>
    );

}
