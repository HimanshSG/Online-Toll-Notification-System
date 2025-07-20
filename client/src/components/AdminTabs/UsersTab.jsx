import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getAdminUsers } from '@/lib/api';
import { formatCurrency, getInitials } from '@/lib/utils';
import UserBalanceForm from '@/components/UserBalanceForm';
import { useDarkMode } from '@/components/contexts/DarkModeContext';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

const UsersTab = () => {
  const { darkMode } = useDarkMode();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('All Users');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [balanceFormOpen, setBalanceFormOpen] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        sortBy,
        sortOrder,
        filter: userFilter !== 'All Users' ? userFilter : undefined,
      };
      
      const response = await getAdminUsers(params);
      setUsers(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and page/sort changes
  useEffect(() => {
    fetchUsers();
  }, [pagination.page, sortBy, sortOrder, userFilter]);

  // Handle search
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  // Handle user filter change
  const handleUserFilterChange = (value) => {
    setUserFilter(value);
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));

    // Reset sorting unless it's Recently Added
    if (value === 'Recently Added') {
      setSortBy('createdAt');
      setSortOrder('desc');
    } else {
      setSortBy('name');
      setSortOrder('asc');
    }
  };

  // Handle edit user balance
  const handleEditBalance = (user) => {
    setSelectedUser(user);
    setBalanceFormOpen(true);
  };

  // Handle balance update success
  const handleBalanceUpdateSuccess = () => {
    setBalanceFormOpen(false);
    fetchUsers();
  };

  // Handle pagination
  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Status badge styling
  const getStatusBadge = (user) => {
    const balance = Number(user.fastagBalance);
    const isLowBalance = balance < 200;
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${
        isLowBalance 
          ? darkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800'
          : darkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
      }`}>
        {isLowBalance ? 'Low Balance' : 'Active'}
      </span>
    );
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-neutral-dark'}`}>
            User Management
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage user accounts and FASTag information
          </p>
        </div>
        {/* <Button 
          className="bg-primary hover:bg-primary/90" 
          onClick={() => toast({
            title: 'Export initiated',
            description: 'User data export has started. You will be notified when ready.',
          })}
        >
          <FontAwesomeIcon icon={faDownload} className="mr-2" />
          Export Data
        </Button> */}
      </div>

      {/* Search and Filter Section */}
      <Card className={`shadow-sm p-5 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon 
                    icon="search" 
                    className={darkMode ? 'text-gray-400' : 'text-gray-500'} 
                  />
                </div>
                <Input 
                  type="text" 
                  placeholder="Search users by name, email, or FASTag ID..." 
                  className={`pl-10 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select 
                value={userFilter} 
                onValueChange={handleUserFilterChange}
              >
                <SelectTrigger className={`w-[180px] ${darkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}>
                  <SelectValue placeholder="Filter Users" />
                </SelectTrigger>
                <SelectContent className={darkMode ? 'bg-gray-800' : ''}>
                  <SelectItem value="All Users">All Users</SelectItem>
                  <SelectItem value="Active Users">Active Users</SelectItem>
                  <SelectItem value="Low Balance">Low Balance</SelectItem>
                  <SelectItem value="Recently Added">Recently Added</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={`${sortBy}-${sortOrder}`} 
                onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
              >
                <SelectTrigger className={`w-[180px] ${darkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className={darkMode ? 'bg-gray-800' : ''}>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="fastagBalance-desc">Balance (High to Low)</SelectItem>
                  <SelectItem value="fastagBalance-asc">Balance (Low to High)</SelectItem>
                  <SelectItem value="createdAt-desc">Recently Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className={`shadow-sm overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            {/* Table Header */}
            <thead className={darkMode ? 'bg-gray-900' : 'bg-gray-50'}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">FASTag ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehicle No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
              {loading ? (
                // Skeleton Loader
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-10 w-10 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
                        <div className="ml-4 space-y-2">
                          <div className={`h-4 w-32 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                          <div className={`h-3 w-48 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                        </div>
                      </div>
                    </td>
                    {[...Array(5)].map((_, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap">
                        <div className={`h-4 w-20 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={6} className={`px-6 py-10 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No users found matching your criteria
                  </td>
                </tr>
              ) : (
                // User Data Rows
                users.map((user) => (
                  <tr key={user._id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                            {getInitials(user.name)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {user.name}
                          </div>
                          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user.fastagId}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user.vehicleNumber}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap font-medium ${
                      Number(user.fastagBalance) < 200 
                        ? darkMode ? 'text-red-400' : 'text-red-600'
                        : darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {formatCurrency(user.fastagBalance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-yellow-500 hover:text-yellow-600"
                          onClick={() => handleEditBalance(user)}
                        >
                          <FontAwesomeIcon icon="wallet" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && pagination.pages > 1 && (
          <div className={`px-6 py-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} users
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => goToPage(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => goToPage(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Balance Update Dialog */}
      <Dialog open={balanceFormOpen} onOpenChange={setBalanceFormOpen}>
<DialogContent className={`sm:max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
  <DialogHeader>
    <DialogTitle className={darkMode ? 'text-white' : ''}>
      Update FASTag Balance
    </DialogTitle>
    <DialogDescription>
      Update the user's FASTag wallet balance
    </DialogDescription>
  </DialogHeader>
  <UserBalanceForm 
    user={selectedUser} 
    onSuccess={handleBalanceUpdateSuccess} 
    onCancel={() => setBalanceFormOpen(false)} 
    darkMode={darkMode}
  />
</DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersTab;