import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAdminTollPlazas, createTollPlaza, updateTollPlaza, deleteTollPlaza } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import TollPlazaForm from '@/components/TollPlazaForm';
import { useDarkMode } from '@/components/contexts/DarkModeContext';

const TollsTab = () => {
  const { darkMode } = useDarkMode();
  const { toast } = useToast();
  const [tollPlazas, setTollPlazas] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roadFilter, setRoadFilter] = useState('All Roads');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editingToll, setEditingToll] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [uniqueRoads, setUniqueRoads] = useState(['All Roads']);

  // Fetch toll plazas and unique roads
  const fetchTollPlazas = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        roadName: roadFilter === 'All Roads' ? '' : roadFilter,
        sortBy,
        sortOrder
      };
      
      const response = await getAdminTollPlazas(params);
      setTollPlazas(response.data);
      setPagination(response.pagination);

      // Update unique roads list if we're not filtering
      if (roadFilter === 'All Roads') {
        const roadsResponse = await getAdminTollPlazas({ limit: 1000 });
        const roads = ['All Roads', ...new Set(roadsResponse.data.map(toll => toll.roadName))];
        setUniqueRoads(roads);
      }
    } catch (error) {
      console.error('Error fetching toll plazas:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load toll plaza data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and when dependencies change
  useEffect(() => {
    fetchTollPlazas();
  }, [pagination.page, sortBy, sortOrder, roadFilter]);

  // Handle search
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle road filter change
  const handleRoadFilterChange = (value) => {
    setRoadFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle form submission
  const handleFormSubmit = async (data) => {
    try {
      if (editingToll) {
        await updateTollPlaza(editingToll._id, data);
        toast({
          title: 'Success',
          description: 'Toll plaza updated successfully.',
        });
      } else {
        await createTollPlaza(data);
        toast({
          title: 'Success',
          description: 'New toll plaza added successfully.',
        });
      }
      setFormOpen(false);
      setEditingToll(null);
      fetchTollPlazas();
    } catch (error) {
      console.error('Error saving toll plaza:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save toll plaza data.',
        variant: 'destructive',
      });
    }
  };

  // Handle delete toll plaza
  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    
    try {
      await deleteTollPlaza(confirmDeleteId);
      toast({
        title: 'Success',
        description: 'Toll plaza deleted successfully.',
      });
      setConfirmDeleteId(null);
      fetchTollPlazas();
    } catch (error) {
      console.error('Error deleting toll plaza:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete toll plaza.',
        variant: 'destructive',
      });
    }
  };

  // Handle edit toll plaza
  const handleEdit = (toll) => {
    setEditingToll(toll);
    setFormOpen(true);
  };

  // Handle pagination
  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-neutral-dark'}`}>
            Toll Management
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage toll plaza details across the network
          </p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90" 
          onClick={() => {
            setEditingToll(null);
            setFormOpen(true);
          }}
        >
          <FontAwesomeIcon icon="plus" className="mr-2" /> Add New Toll
        </Button>
      </div>

      {/* Search and Filter */}
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
                  placeholder="Search toll plazas..." 
                  className={`pl-10 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={roadFilter} onValueChange={handleRoadFilterChange}>
                <SelectTrigger className={`w-[180px] ${darkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}>
                  <SelectValue placeholder="All Roads" />
                </SelectTrigger>
                <SelectContent className={darkMode ? 'bg-gray-800' : ''}>
                  {uniqueRoads.map(road => (
                    <SelectItem key={road} value={road}>{road}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={`${sortBy}-${sortOrder}`} 
                onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                <SelectTrigger className={`w-[180px] ${darkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}>
                  <SelectValue placeholder="Sort by Name" />
                </SelectTrigger>
                <SelectContent className={darkMode ? 'bg-gray-800' : ''}>
                  <SelectItem value="name-asc">Sort by Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Sort by Name (Z-A)</SelectItem>
                  <SelectItem value="tollFee-desc">Sort by Fee (High-Low)</SelectItem>
                  <SelectItem value="tollFee-asc">Sort by Fee (Low-High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toll Table */}
      <Card className={`shadow-sm overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={darkMode ? 'bg-gray-900' : 'bg-gray-50'}>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Road</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fee</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`h-4 w-8 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`h-4 w-40 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`h-4 w-20 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`h-4 w-16 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`h-4 w-32 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`h-4 w-20 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                    </td>
                  </tr>
                ))
              ) : tollPlazas.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`px-6 py-10 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No toll plazas found. Try a different search or add a new toll plaza.
                  </td>
                </tr>
              ) : (
                tollPlazas.map((toll) => (
                  <tr key={toll._id}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-neutral-dark'}`}>
                      {toll._id.substring(18, 24)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {toll.name}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {toll.roadName}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(Number(toll.tollFee))}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {toll.latitude.toFixed(6)}, {toll.longitude.toFixed(6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:text-primary/80"
                          onClick={() => handleEdit(toll)}
                        >
                          <FontAwesomeIcon icon="edit" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-600"
                          onClick={() => setConfirmDeleteId(toll._id)}
                        >
                          <FontAwesomeIcon icon="trash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className={`px-6 py-3 flex items-center justify-between border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex-1 flex justify-between sm:hidden">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => goToPage(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => goToPage(Math.min(pagination.pages, pagination.page + 1))}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
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
                    
                    if (pagination.pages > 5 && (
                      (i === 0 && pageNum !== 1) || 
                      (i === 4 && pageNum !== pagination.pages)
                    )) {
                      return (
                        <span 
                          key={i} 
                          className={`relative inline-flex items-center px-4 py-2 border ${
                            darkMode ? 'border-gray-700 bg-gray-800 text-gray-400' : 'border-gray-300 bg-white text-gray-700'
                          } text-sm font-medium`}
                        >
                          ...
                        </span>
                      );
                    }
                    
                    return (
                      <Button 
                        key={i} 
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
          </div>
        )}
      </Card>
      
      {/* Add/Edit Toll Form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className={`sm:max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : ''}>
              {editingToll ? 'Edit Toll Plaza' : 'Add New Toll Plaza'}
            </DialogTitle>
          </DialogHeader>
          <TollPlazaForm 
            toll={editingToll} 
            onSubmit={handleFormSubmit} 
            onCancel={() => setFormOpen(false)} 
            darkMode={darkMode}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent className={`sm:max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : ''}>
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <p className={darkMode ? 'text-gray-300' : ''}>
            Are you sure you want to delete this toll plaza? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDeleteId(null)}
              className={darkMode ? 'border-gray-600 text-white' : ''}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TollsTab;