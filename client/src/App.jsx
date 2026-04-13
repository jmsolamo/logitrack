import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AlertToastProvider } from './components/ui/alert-toast-provider';
import LoginPage from './Pages/loginPage';
import AdminDashboard from './Pages/admin/overview/adminDashboard';
import AdminLayout from './components/admin/AdminLayout';
import UserLayout from './components/user/UserLayout';
import UsersDashboard from './Pages/users/users-dashboard';
import UserCalendar from './Pages/users/user-calendar';
import UserDeliveries from './Pages/users/user-deliveries';
import UserJobOrders from './Pages/users/user-job-orders';
import DeliveryPlan from './Pages/admin/overview/deliver-plan';
import Calendar from './Pages/admin/overview/calendar';
import ActualExpenses from './Pages/admin/overview/admin-delivery-expenses/actual-expenses';
import DieselExpenses from './Pages/admin/overview/admin-delivery-expenses/diesel-expenses';
import DriverExpenseBreakdown from './Pages/admin/overview/admin-delivery-expenses/driver-expese-breakdown';
import JobOrders from './Pages/admin/overview/admin-delivery-expenses/job-orders';
import RequestPage from './Pages/admin/overview/request';
import ReportsPage from './Pages/admin/overview/reports';
import PurchasesPage from './Pages/admin/overview/purchases';
import ActiveTripsPage from './Pages/admin/management/active-trips';
import DestinationPage from './Pages/admin/management/destination';
import DeliveryChargePage from './Pages/admin/management/delivery-charge';
import VehiclesPage from './Pages/admin/management/vehicles';
import PersonnelsPage from './Pages/admin/management/personnels';
import MembersPage from './Pages/admin/team/members';
import ApprovalPage from './Pages/admin/team/approval';
import SettingsPage from './Pages/SettingsPage';
import './lib/axios';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AlertToastProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Admin routes with sidebar layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="delivery-plan" element={<DeliveryPlan />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="request" element={<RequestPage />} />
            <Route path="purchases" element={<PurchasesPage />} />
            <Route path="reports" element={<ReportsPage />} />

            <Route path="trips" element={<ActiveTripsPage />} />
            <Route path="destinations" element={<DestinationPage />} />
            <Route path="delivery-charge" element={<DeliveryChargePage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="personnels" element={<PersonnelsPage />} />

            <Route path="members" element={<MembersPage />} />
            <Route path="approvals" element={<ApprovalPage />} />

            <Route path="delivery-expenses/actual" element={<ActualExpenses />} />
            <Route path="delivery-expenses/diesel" element={<DieselExpenses />} />
            <Route path="delivery-expenses/breakdown" element={<DriverExpenseBreakdown />} />
            <Route path="delivery-expenses/job-orders" element={<JobOrders />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* User routes with sidebar layout */}
          <Route path="/user" element={<UserLayout />}>
            <Route path="dashboard" element={<UsersDashboard />} />
            <Route path="calendar" element={<UserCalendar />} />
            <Route path="deliveries" element={<UserDeliveries />} />
            <Route path="job-orders" element={<UserJobOrders />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AlertToastProvider>
    </BrowserRouter>
  );
}

export default App;
