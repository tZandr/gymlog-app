import { createBrowserRouter } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import CoachLayout from './layouts/CoachLayout';
import Profile from './pages/Profile';
import Exercises from './pages/Exercises';
import ActiveWorkout from './pages/ActiveWorkout';
import Settings from './pages/Settings';
import History from './pages/History';
import Login from './pages/Login';
import Invite from './pages/Invite';
import CoachSignup from './pages/CoachSignup';
import Clients from './pages/coach/Clients';
import { RequireAuth } from './components/RequireAuth';
import { RoleHome } from './components/RoleHome';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
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
        element: <MainLayout />,
        children: [
          {
            path: '/',
            element: <RoleHome />,
          },
          {
            path: '/profile',
            element: <Profile />,
          },
          {
            path: '/workouts',
            element: <Exercises />,
          },
          {
            path: '/workouts/:id',
            element: <ActiveWorkout />,
          },
          {
            path: '/settings',
            element: <Settings />,
          },
          {
            path: '/history',
            element: <History />,
          },
        ],
      },
      {
        element: <CoachLayout />,
        children: [
          {
            path: '/coach/clients',
            element: <Clients />,
          },
        ],
      },
    ],
  },
]);
