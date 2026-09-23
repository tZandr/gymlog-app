import { createBrowserRouter } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import CoachLayout from './layouts/CoachLayout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Exercises from './pages/Exercises';
import ActiveWorkout from './pages/ActiveWorkout';
import Settings from './pages/Settings';
import History from './pages/History';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Invite from './pages/Invite';
import CoachSignup from './pages/CoachSignup';
import Clients from './pages/coach/Clients';
import ClientDashboard from './pages/client/Dashboard';
import { RequireAuth } from './components/RequireAuth';
import { RequireRole } from './components/RequireRole';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/invite/:token',
    element: <Invite />,
  },
  {
    path: '/coach-signup/:token',
    element: <CoachSignup />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        // The base app: a standard training log for any signed-in user, connected
        // to a coach or not. /client is the connected view inside it (phone layout).
        element: <MainLayout />,
        children: [
          { path: '/', element: <Home /> },
          { path: '/profile', element: <Profile /> },
          { path: '/workouts', element: <Exercises /> },
          { path: '/workouts/:id', element: <ActiveWorkout /> },
          { path: '/settings', element: <Settings /> },
          { path: '/history', element: <History /> },
          { path: '/client', element: <ClientDashboard /> },
        ],
      },
      {
        // Coach dashboard (wide layout with sidebar), coaches only.
        element: <RequireRole role="coach" />,
        children: [
          {
            element: <CoachLayout />,
            children: [
              { path: '/admin/clients', element: <Clients /> },
            ],
          },
        ],
      },
    ],
  },
]);
