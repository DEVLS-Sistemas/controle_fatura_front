import React from 'react';
import { ProjectsStatusChart, StoreVisitsChart, MyPortfolioCharts, UsersByDeviceCharts } from './Dunut';
import { UsersByDeviceLegendsCharts } from './Legend';

interface Props {
  type: 'storeVisits' | 'projectsStatus' | 'myPortfolioCharts'| 'usersByDeviceCharts';
  series: number[];
  dataLabelText: string[]; 
  dataColors: string[];
  option: {};
}

const DynamicLegendDashboard: React.FC<Props> = ({ type, series, dataLabelText, dataColors, option }) => {
  switch (type) {
    // case 'storeVisits':
    //   return <StoreVisitsChart series={series} dataColors={dataColors} dataLabelText={dataLabelText} />;
    // case 'projectsStatus':
    //   return <ProjectsStatusChart series={series} dataColors={dataColors} dataLabelText={dataLabelText} />;
    // case 'myPortfolioCharts':
    //   return <MyPortfolioCharts series={series} dataColors={dataColors} dataLabelText={dataLabelText} />;
    case 'usersByDeviceCharts':
      return <UsersByDeviceLegendsCharts series={series} dataColors={dataColors} dataLabelText={dataLabelText} option={option} />;

      
    default:
      return <p>Tipo de dashboard inválido</p>;
  }
};

export default DynamicLegendDashboard;
