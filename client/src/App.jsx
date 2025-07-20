import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";
import { useEffect, useState } from 'react';
import { Switch, Route, useLocation } from "wouter";
import { toast, useToast } from "./hooks/use-toast.js";

import NotFound from "./pages/not-found";
import Welcome from "./pages/welcome";
import Login from "./pages/login";
import Register from "./pages/register";
import OtpVerification from "./pages/otp-verification";
import AdminLogin from "./pages/admin-login";
import UserDashboard from "./pages/user-dashboard";
import AdminDashboard from "./pages/admin-dashboard";
import NearbyTolls from "@/pages/nearby-tolls";
import PlanRoute from "./pages/plan-route";
import Profile from "./pages/profile";
import Settings from "./pages/settings";
import History from "./pages/history";
import ForgotPassword from "./pages/forgot-password";
import ResetPassword from "./pages/reset-password";



import { library } from '@fortawesome/fontawesome-svg-core';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

import { getCurrentUser } from "./lib/auth";
import { DarkModeProvider } from './components/contexts/DarkModeContext.jsx';

library.add(faDownload);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const { toasts, toast: toastFn, dismiss } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (userData) {
          setIsAuthenticated(true);
          setIsAdmin(userData.isAdmin || false);

          if (["/", "/login", "/register", "/admin-login"].includes(location)) {
            setLocation(userData.isAdmin ? "/admin/dashboard" : "/dashboard");
          }
        } else {
          if (
            ["/dashboard", "/profile", "/admin/dashboard", "/admin/dashboard/toll-plazas", "/admin/dashboard/users", "/admin/dashboard/reports", "/admin/dashboard/settings", "/nearby", "/route-planner", "/settings", "/history"]
              .some(path => location.startsWith(path))
          ) {
            setLocation("/");
            toastFn({
              title: "Session expired",
              description: "Please login again to continue.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location, setLocation, toastFn]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  

  return (
    <DarkModeProvider>
      <ToastProvider>
        <div className="min-h-screen bg-background dark:bg-gray-900 text-foreground dark:text-gray-100">
          <Switch>
            <Route path="/" component={Welcome} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/verify-otp" component={OtpVerification} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route path="/admin-login" component={AdminLogin} />

            {/* Protected user routes */}
            <Route path="/dashboard">
              {isAuthenticated && !isAdmin ? <UserDashboard /> : <Login />}
            </Route>
            <Route path="/nearby">
              {isAuthenticated && !isAdmin ? <NearbyTolls /> : <Login />}
            </Route>
            <Route path="/route-planner">
              {isAuthenticated && !isAdmin ? <PlanRoute /> : <Login />}
            </Route>
            <Route path="/profile">
              {isAuthenticated && !isAdmin ? <Profile /> : <Login />}
            </Route>
            <Route path="/settings">
              {isAuthenticated && !isAdmin ? <Settings /> : <Login />}
            </Route>
            <Route path="/history">
              {isAuthenticated && !isAdmin ? <History /> : <Login />}
            </Route>

            {/* Explicitly declared admin routes */}
            <Route path="/admin/dashboard">
              {isAuthenticated && isAdmin ? <AdminDashboard /> : <AdminLogin />}
            </Route>
            <Route path="/admin/dashboard/toll-plazas">
              {isAuthenticated && isAdmin ? <AdminDashboard /> : <AdminLogin />}
            </Route>
            <Route path="/admin/dashboard/users">
              {isAuthenticated && isAdmin ? <AdminDashboard /> : <AdminLogin />}

            </Route>
            <Route path="/admin/dashboard/notifications">
  {isAuthenticated && isAdmin ? <AdminDashboard /> : <AdminLogin />}
</Route>

            <Route path="/admin/dashboard/reports">
              {isAuthenticated && isAdmin ? <AdminDashboard /> : <AdminLogin />}
            </Route>
            <Route path="/admin/dashboard/settings">
              {isAuthenticated && isAdmin ? <AdminDashboard /> : <AdminLogin />}
            </Route>

            {/* Fallback 404 */}
            <Route component={NotFound} />
          </Switch>

          {/* Toasts */}
          {toasts.map((t) => (
            <Toast
              key={t.id}
              open={t.open}
              onOpenChange={(open) => {
                if (!open) dismiss(t.id);
              }}
              variant={t.variant}
            >
              <div className="grid gap-1">
                {t.title && <ToastTitle>{t.title}</ToastTitle>}
                {t.description && <ToastDescription>{t.description}</ToastDescription>}
              </div>
              <ToastClose />
            </Toast>
          ))}

          <ToastViewport />
        </div>
      </ToastProvider>
    </DarkModeProvider>
  );
}


export default App;
