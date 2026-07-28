import { formatarParaMoedaSemSimbolo } from 'helpers/functions_helpers';
import React from 'react';
import CountUp from 'react-countup';

export interface UsersByDeviceLegendsChartsProps {
    series: number[];
    dataLabelText: string[]; 
    dataColors: string[];
    option: {};
}

const UsersByDeviceLegendsCharts = ({ series, dataColors, dataLabelText, option }: UsersByDeviceLegendsChartsProps) => {

return (
    <React.Fragment>
        <div className="table-responsive mt-3">
            <table className="table table-borderless table-sm table-centered align-middle table-nowrap mb-0">
                <tbody className="border-0">
                {dataLabelText.map((label, index) => (
                    <tr key={index}>
                        {option && option.legenda &&
                            <td>
                                <h4 className="text-truncate fs-14 fs-medium mb-0">
                                <i
                                    className={`ri-stop-fill align-middle fs-18 text-${dataColors[index]} me-2`}
                                ></i>
                                {label}
                                </h4>
                            </td>
                        }
                        {option && option.total &&
                            <td>
                                <p className="text-muted text-end mb-0">
                                    {/* {formatarParaMoedaSemSimbolo(series[index])} */}
                                    <CountUp
                                            start={0}
                                            end={series[index]}
                                            decimals={2}
                                            decimal={","}
                                            duration={1}
                                        />
                                </p>
                            </td>
                        }
                        {option && option.percentual &&
                            <td className="text-end">
                                <p className="text-success fw-medium fs-12 mb-0">
                                <i className="ri-arrow-up-s-fill fs-5 align-middle"></i>2.08%
                                </p>
                            </td>
                        }
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
    </React.Fragment>
    );
};
export default UsersByDeviceLegendsCharts;    