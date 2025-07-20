import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faBolt, faUsers, faMoneyBillWave, faClock, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';

library.add(faBolt, faUsers, faMoneyBillWave, faClock, faArrowUp, faArrowDown);


const AdminStatsCard = ({ title, value, icon, color, change, period }) => {
  // Color variants
  const colorVariants = {
    green: {
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      changeColorUp: 'text-green-600',
      changeColorDown: 'text-red-600'
    },
    blue: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      changeColorUp: 'text-green-600',
      changeColorDown: 'text-red-600'
    },
    purple: {
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      changeColorUp: 'text-green-600',
      changeColorDown: 'text-red-600'
    },
    orange: {
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      changeColorUp: 'text-green-600',
      changeColorDown: 'text-red-600'
    },
    red: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      changeColorUp: 'text-green-600',
      changeColorDown: 'text-red-600'
    }
  };

  if (!colorVariants[color]) {
    console.warn(`Unknown color variant '${color}', defaulting to 'blue'`);
  }
  
  const colorClasses = colorVariants[color] || colorVariants.blue;
  const isPositiveChange = change > 0;
  
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-neutral-dark">
  {Number(value).toLocaleString()}
</p>
            {change !== undefined && change !== null && (
              <div className="flex items-center mt-2">
                <FontAwesomeIcon 
                  icon={isPositiveChange ? faArrowUp : faArrowDown}
                  className={`text-xs mr-1 ${
                    isPositiveChange 
                      ? colorClasses.changeColorUp
                      : colorClasses.changeColorDown
                  }`}
                />
                <span className={`text-xs ${
                  isPositiveChange 
                    ? colorClasses.changeColorUp
                    : colorClasses.changeColorDown
                }`}>
                  {Math.abs(change)}%
                </span>
                {period && (
                  <span className="text-xs text-gray-500 ml-1">
                    {period}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className={`${colorClasses.iconBg} rounded-full p-3`}>
            <FontAwesomeIcon icon={icon} className={`${colorClasses.iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminStatsCard;