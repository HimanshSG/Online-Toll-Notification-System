import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatCurrency } from '@/lib/utils';

const FastagBalanceCard = ({
  fastagBalance,
  fastagId,
  isVerified,
  onRechargeClick,
}) => {
  const isLowBalance = fastagBalance < 200;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex justify-between">
          <div>
            <div className="flex items-center space-x-1 mb-1">
              <h3 className="font-semibold text-lg">FASTag Balance</h3>
              {isVerified ? (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                  Verified
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                  Pending
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-2">
              ID: {fastagId}
            </p>
            <div className="flex items-baseline mb-4">
              <span
                className={`text-2xl font-bold ${
                  isLowBalance ? 'text-red-500' : 'text-neutral-dark'
                }`}
              >
                {formatCurrency(fastagBalance)}
              </span>
              {isLowBalance && (
                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                  Low Balance
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start">
            <Button
              onClick={onRechargeClick}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <FontAwesomeIcon icon="wallet" className="mr-2" />
              Recharge
            </Button>
          </div>
        </div>

        {isLowBalance && (
          <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-700">
            <FontAwesomeIcon icon="exclamation-circle" className="mr-1" />
            Your FASTag balance is low. Please recharge to avoid inconvenience at toll plazas.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FastagBalanceCard;
