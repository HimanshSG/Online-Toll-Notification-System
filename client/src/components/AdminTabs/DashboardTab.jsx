import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminStatsCard from '@/components/AdminStatsCard';
import { timeAgo } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const DashboardTab = ({ stats }) => {
  // If no stats, show loading
  if (!stats) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-dark">Dashboard</h1>
          <p className="text-gray-500">Welcome to the TollNotify admin dashboard</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div className="animate-pulse">
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 w-16 bg-gray-300 rounded"></div>
                  </div>
                  <div className="bg-gray-100 rounded-full p-3">
                    <div className="h-5 w-5 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card className="shadow-sm mb-6">
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded mb-3"></div>
              <div className="h-12 bg-gray-200 rounded mb-3"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-dark">Dashboard</h1>
        <p className="text-gray-500">Welcome to the TollNotify admin dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AdminStatsCard
          title="Total Users"
          value={stats.usersCount.toLocaleString()}
          icon="users"
          color="green"
          change={12}
          period="Since last month"
        />

        <AdminStatsCard
          title="Active Sessions"
          value={stats.activeSessionsCount.toLocaleString()}
          icon="bolt"
          color="blue"
          change={8}
          period="Since yesterday"
        />

        <AdminStatsCard
          title="Toll Notifications"
          value={stats.notificationsCount.toLocaleString()}
          icon="bell"
          color="purple"
          change={22}
          period="Since last week"
        />

        <AdminStatsCard
          title="Total Toll Plazas"
          value={stats.tollPlazasCount.toLocaleString()}
          icon="road"
          color="orange"
          change={0}
          period="No change"
        />
      </div>

      {/* Recent Notifications */}
      <Card className="shadow-sm mb-6">
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">User</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Details</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Time</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentNotifications && stats.recentNotifications.length > 0 ? (
                  stats.recentNotifications.map((notification) => (
                    <tr key={notification._id}>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          notification.type === 'proximity' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {notification.type}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        {notification.userId?.name || 'Unknown User'}
                      </td>
                      <td className="px-3 py-3 text-sm">{notification.message}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {timeAgo(notification.sentAt)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          notification.status === 'seen' 
                            ? 'bg-green-100 text-green-800' 
                            : notification.status === 'delivered' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {notification.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-3 py-6 text-center text-sm text-gray-500" colSpan={5}>
                      No recent notifications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardTab;
