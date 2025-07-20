import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getAdminNotifications } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const NotificationsTab = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        type: typeFilter
      };
      
      const response = await getAdminNotifications(params);
      setNotifications(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [pagination.page, typeFilter]);

  // Handle filter change
  const handleTypeFilterChange = (value) => {
    setTypeFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Get notification type badge
  const getTypeBadge = (type) => {
    return type === 'proximity' ? (
      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
        proximity
      </span>
    ) : (
      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
        balance
      </span>
    );
  };

  // Get notification status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'seen':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            seen
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            delivered
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
            sent
          </span>
        );
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-dark">Notifications</h1>
          <p className="text-gray-500">Monitor and manage system notifications</p>
        </div>
        
        <Select 
          value={typeFilter} 
          onValueChange={handleTypeFilterChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="proximity">Toll Proximity</SelectItem>
            <SelectItem value="balance">Balance Alerts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Notification Logs</CardTitle>
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
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="h-6 w-64 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : notifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-gray-500">
                      No notifications found.
                    </td>
                  </tr>
                ) : (
                  notifications.map((notification) => (
                    <tr key={`${notification.id || notification._id || Math.random()}-${notification.sentAt}`}>

                      <td className="px-3 py-3 whitespace-nowrap">
                        {getTypeBadge(notification.type)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        {notification.userId?.name || 'Unknown User'}
                      </td>
                      <td className="px-3 py-3 text-sm">{notification.message}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(notification.sentAt)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {getStatusBadge(notification.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!loading && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> notifications
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-l-md"
                    onClick={() => goToPage(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                  >
                    <FontAwesomeIcon icon="chevron-left" className="h-4 w-4" />
                  </Button>
                  
                  {/* Pagination numbers */}
                  {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <Button 
                        key={pageNum}  // ✅ Use pageNum instead of index
                        variant={pagination.page === pageNum ? 'default' : 'outline'} 
                        size="sm"
                        className={pagination.page === pageNum ? 'bg-primary text-white' : ''}
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                    
                  })}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-r-md" 
                    onClick={() => goToPage(Math.min(pagination.pages, pagination.page + 1))}
                    disabled={pagination.page === pagination.pages}
                  >
                    <FontAwesomeIcon icon="chevron-right" className="h-4 w-4" />
                  </Button>
                </nav>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsTab;
