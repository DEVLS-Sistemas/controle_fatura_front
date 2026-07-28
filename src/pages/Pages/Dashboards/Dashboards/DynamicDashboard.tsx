import React from 'react';
import { ProjectsStatusChart, StoreVisitsChart, MyPortfolioCharts, UsersByDeviceCharts } from './Dunut';

interface Props {
  type: 'storeVisits' | 'projectsStatus' | 'myPortfolioCharts'| 'usersByDeviceCharts';
  series: number[];
  dataLabelText: string[]; 
  dataColors: string;
}

const DynamicDashboard: React.FC<Props> = ({ type, series, dataLabelText, dataColors }) => {
  switch (type) {
    case 'storeVisits':
      return <StoreVisitsChart series={series} dataColors={dataColors} dataLabelText={dataLabelText} />;
    case 'projectsStatus':
      return <ProjectsStatusChart series={series} dataColors={dataColors} dataLabelText={dataLabelText} />;
    case 'myPortfolioCharts':
      return <MyPortfolioCharts series={series} dataColors={dataColors} dataLabelText={dataLabelText} />;
    case 'usersByDeviceCharts':
      return <UsersByDeviceCharts series={series} dataColors={dataColors} dataLabelText={dataLabelText} />;

      
    default:
      return <p>Tipo de dashboard inválido</p>;
  }
};

export default DynamicDashboard;
