import { getChartColorsArray } from 'helpers/dashboards_helpers';
import { formatarParaMoedaSemSimbolo } from 'helpers/functions_helpers';
import React from 'react';
import ReactApexChart from 'react-apexcharts';


interface Props {
  series: number[];
  dataLabelText: string[]; 
  dataColors: string;
}

const UsersByDeviceCharts: React.FC<Props> = ({ series, dataColors, dataLabelText }) => {
  const colors = getChartColorsArray(dataColors);
  const options = {
    labels: dataLabelText,
    chart: {
        type: "donut",
        height: 219,
    },
    plotOptions: {
        pie: {
            size: 100,
            donut: {
                size: "76%",
            },
        },
    },
    dataLabels: {
        enabled: false,
    },
    legend: {
        show: false,
        position: 'bottom',
        horizontalAlign: 'center',
        offsetX: 0,
        offsetY: 0,
        markers: {
            width: 20,
            height: 6,
            radius: 2,
        },
        itemMargin: {
            horizontal: 12,
            vertical: 0
        },
    },
    stroke: {
        width: 0
    },
    yaxis: {
        labels: {
            formatter: function (value:any) {
                return formatarParaMoedaSemSimbolo(value) + '';
            }
        },
        tickAmount: 4,
        min: 0
    },
    colors,
  };

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="donut"
      height={219}
      className="apex-charts"
      dir="ltr"
    />
  );
};

export default UsersByDeviceCharts;
