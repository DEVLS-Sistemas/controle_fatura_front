import { getChartColorsArray } from 'helpers/dashboards_helpers';
import React from 'react';
import ReactApexChart from 'react-apexcharts';

interface Props {
  series: number[];
  dataLabelText: string[]; 
  dataColors: string;
}

const MyPortfolioCharts: React.FC<Props> = ({ series, dataColors, dataLabelText}) => {
  const colors = getChartColorsArray(dataColors);
  const options = {
    labels: dataLabelText,
    chart: { type: 'donut', height: 224 },
    plotOptions: {
        pie: {
            size: 100,
            offsetX: 0,
            offsetY: 0,
            donut: {
                size: "70%",
                labels: {
                    show: true,
                    name: {
                        show: true,
                        fontSize: '18px',
                        offsetY: -5,
                    },
                    value: {
                        show: true,
                        fontSize: '20px',
                        color: '#343a40',
                        fontWeight: 500,
                        offsetY: 5,
                        formatter: function (val : any) {
                            return "$" + val;
                        }
                    },
                    total: {
                        show: true,
                        fontSize: '13px',
                        label: '',
                        color: '#9599ad',
                        fontWeight: 500,
                        formatter: function (w : any) {
                            return "$" + w.globals.seriesTotals.reduce(function (a : any, b : any) {
                                return a + b;
                            }, 0);
                        }
                    }
                }
            },
        },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    yaxis: {
        labels: {
            formatter: function (value : any) {
                return "$" + value;
            }
        }
    },
    stroke: { lineCap: 'round', width: 2 },
    colors,
  };

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="donut"
      height={210}
      className="apex-charts"
      dir="ltr"
    />
  );
};

export default MyPortfolioCharts;
