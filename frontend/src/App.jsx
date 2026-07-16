import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import SetPassword from './pages/SetPassword';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Organization from './pages/Organization';
import Security from './pages/Security';
import Devices from './pages/Devices';
import Billing from './pages/Billing';
import BillingSuccess from './pages/BillingSuccess';
import BillingCancel from './pages/BillingCancel';
import Settings from './pages/Settings';

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/set-password', element: <SetPassword /> },
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/users', element: <Users /> },
      { path: '/organization', element: <Organization /> },
      { path: '/security', element: <Security /> },
      { path: '/devices', element: <Devices /> },
      { path: '/billing', element: <Billing /> },
      { path: '/billing/success', element: <BillingSuccess /> },
      { path: '/billing/cancel', element: <BillingCancel /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
  { path: '*', element: <Login /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
