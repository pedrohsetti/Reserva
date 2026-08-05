import DashboardDev from './DashboardDev';
import DashboardAdmin from './DashboardAdmin';
import DashboardOwner from './DashboardOwner';
import DashboardStaff from './DashboardStaff';
import DashboardCustomer from './DashboardCustomer';
import DashboardOnboarding from './DashboardOnboarding';

/**
 * Dashboard - Main component that renders role-specific dashboard variants
 * Routes to the appropriate dashboard based on user.role:
 * - 'dev' -> DashboardDev (system overview)
 * - 'admin' -> DashboardAdmin (business metrics)
 * - 'owner' -> DashboardOwner (business KPIs)
 * - 'staff' -> DashboardStaff (my schedule)
 * - 'customer' -> DashboardCustomer (my bookings)
 */
const Dashboard = ({ user, token }) => {
	if (!user) {
		return <div className="card dashboard-card">Loading...</div>;
	}

	if (user.role !== 'dev' && !user.businessId) {
		return <DashboardOnboarding user={user} token={token} />;
	}

	switch (user.role) {
		case 'dev':
			return <DashboardDev user={user} token={token} />;
		case 'admin':
			return <DashboardAdmin user={user} token={token} />;
		case 'owner':
			return <DashboardOwner user={user} token={token} />;
		case 'staff':
			return <DashboardStaff user={user} token={token} />;
		case 'customer':
			return <DashboardCustomer user={user} token={token} />;
		default:
			return (
				<div className="card dashboard-card">
					<h2>Welcome {user.name}</h2>
					<p>Dashboard is loading...</p>
				</div>
			);
	}
};

export default Dashboard;
