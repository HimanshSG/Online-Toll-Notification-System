import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getCurrentUser } from '@/lib/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Logo from '@/components/Logo';
import { useMobile } from '@/hooks/use-mobile';

const UserNavigation = ({ notifications = [], onLogout }) => {
  const [_, setLocation] = useLocation();
  const isMobile = useMobile();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get current user
  const user = getCurrentUser();
  
  // Calculate unread notifications count
  const unreadCount = notifications.filter(n => n.status === 'sent').length;
  
  // Get user initials for avatar
  const getInitials = (name) => {
    return name
      ? name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
      : 'U';
  };
  
  const renderNotifications = () => {
    if (notifications.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm">No notifications yet</p>
        </div>
      );
    }
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
  
    const getNotificationMessage = (notification) => {
      switch (notification.type) {
        case 'proximity':
          return `Approaching toll: ${notification.tollName || 'toll plaza'}`;
        case 'balance':
          return `Low balance: ₹${notification.currentBalance || 0}. Minimum threshold: ₹${notification.threshold || 200}`;
        default:
          return notification.message;
      }
    };
  
    return notifications
      .slice(0, 5)
      .map((notification, index) => (
        <div key={notification.id || index} className="border-b border-border last:border-b-0 py-2 px-3">
          <div className="flex items-start">
            <div className={`rounded-full p-1.5 mr-2 ${
              notification.type === 'proximity' 
                ? 'bg-blue-100 dark:bg-blue-900/30' 
                : 'bg-amber-100 dark:bg-amber-900/30'
            }`}>
              <FontAwesomeIcon 
                icon={notification.type === 'proximity' ? 'map-marker-alt' : 'exclamation-triangle'} 
                className={`text-xs ${
                  notification.type === 'proximity' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-amber-600 dark:text-amber-400'
                }`} 
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{getNotificationMessage(notification)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(notification.sentAt)}
              </p>
            </div>
            {notification.status === 'sent' && (
              <div className="w-2 h-2 rounded-full bg-primary ml-2 mt-1" />
            )}
          </div>
        </div>
      ));
  };

  const renderNavItems = () => (
    <>
      <Button 
        variant="ghost" 
        className={`${isMobile ? 'w-full justify-start' : 'px-3 text-muted-foreground hover:text-primary hover:bg-transparent'}`}
        onClick={() => {
          setLocation('/dashboard');
          setMobileMenuOpen(false);
        }}
      >
        <FontAwesomeIcon icon="home" className={isMobile ? "mr-2" : "mr-1"} />
        Home
      </Button>
      <Button 
        variant="ghost" 
        className={`${isMobile ? 'w-full justify-start' : 'px-3 text-muted-foreground hover:text-primary hover:bg-transparent'}`}
        onClick={() => {
          setLocation('/nearby');
          setMobileMenuOpen(false);
        }}
      >
        <FontAwesomeIcon icon="map-marker-alt" className={isMobile ? "mr-2" : "mr-1"} />
        Nearby Tolls
      </Button>
      <Button 
        variant="ghost" 
        className={`${isMobile ? 'w-full justify-start' : 'px-3 text-muted-foreground hover:text-primary hover:bg-transparent'}`}
        onClick={() => {
          setLocation('/route-planner');
          setMobileMenuOpen(false);
        }}
      >
        <FontAwesomeIcon icon="route" className={isMobile ? "mr-2" : "mr-1"} />
        Plan Route
      </Button>
    </>
  );
  
  return (
    <header className="sticky top-0 z-10 py-2 px-4 bg-background shadow-sm border-b border-border">
      <div className="flex justify-between items-center">
        {/* Logo and Mobile Menu Button */}
        <div className="flex items-center space-x-4">
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-muted-foreground hover:text-primary"
            >
              <FontAwesomeIcon icon={mobileMenuOpen ? "times" : "bars"} />
            </Button>
          )}
          <Logo size="medium" />
        </div>
        
        {/* Navigation on desktop */}
        {!isMobile && (
          <nav className="flex flex-1 items-center space-x-1 ml-4">
            {renderNavItems()}
          </nav>
        )}
        
        {/* User Options */}
        <div className="flex items-center space-x-1">
          {/* Notifications */}
          <DropdownMenu open={notificationOpen} onOpenChange={setNotificationOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-muted-foreground hover:text-primary"
              >
                <FontAwesomeIcon icon="bell" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-destructive text-white text-[10px] flex items-center justify-center rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-[320px] bg-background border-border"
            >
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>Notifications</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-1 text-xs text-muted-foreground hover:text-primary"
                  onClick={() => setLocation('/history')}
                >
                  View All
                </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="border-border" />
              {renderNotifications()}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full">
                <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <span className="text-primary text-sm font-semibold">
                    {getInitials(user?.name)}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-background border-border"
            >
              <DropdownMenuLabel className="flex flex-col">
                <span className="font-semibold">{user?.name}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="border-border" />
              <DropdownMenuItem 
                onClick={() => setLocation('/profile')}
                className="focus:bg-accent focus:text-accent-foreground"
              >
                <FontAwesomeIcon icon="user" className="mr-2 text-muted-foreground" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setLocation('/history')}
                className="focus:bg-accent focus:text-accent-foreground"
              >
                <FontAwesomeIcon icon="history" className="mr-2 text-muted-foreground" />
                History
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setLocation('/settings')}
                className="focus:bg-accent focus:text-accent-foreground"
              >
                <FontAwesomeIcon icon="cog" className="mr-2 text-muted-foreground" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="border-border" />
              <DropdownMenuItem 
  onClick={onLogout}
  className="text-red-600 hover:text-white hover:bg-red-600 focus:bg-red-600 focus:text-white font-medium"
>
  <FontAwesomeIcon icon="sign-out-alt" className="mr-2" />
  Logout
</DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobile && mobileMenuOpen && (
        <div className="md:hidden mt-2 pb-2 space-y-1 bg-background border-border rounded-lg shadow-lg">
          {renderNavItems()}
        </div>
      )}
    </header>
  );
};

export default UserNavigation;