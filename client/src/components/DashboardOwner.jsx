import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils/api';

/**
 * DashboardOwner - Business owner dashboard with KPIs and metrics
 * Shows: Staff count, customer count, revenue, upcoming appointments/events
 */
const DashboardOwner = ({ user, token }) => {
	const [business, setBusiness] = useState(null);
	const [stats, setStats] = useState({
		staffCount: 0,
		customerCount: 0,
		upcomingAppointments: 0,
		upcomingEvents: 0,
		totalRevenue: 0,
	});

	useEffect(() => {
		const fetchBusinessData = async () => {
			try {
				// Fetch business info
				const businessRes = await fetchWithAuth('/api/businesses/me', token);
				const businessData = await businessRes.json();
				setBusiness(businessData.business);

				// Fetch staff
				const staffRes = await fetchWithAuth('/api/staff', token);
				const staffData = await staffRes.json();

				// Fetch customers
				const customerRes = await fetchWithAuth('/api/customers', token);
				const customerData = await customerRes.json();

				// Fetch appointments
				const appointmentRes = await fetchWithAuth('/api/appointments', token);
				const appointmentData = await appointmentRes.json();

				// Fetch events
				const eventRes = await fetchWithAuth('/api/events', token);
				const eventData = await eventRes.json();

				// Calculate stats
				const now = new Date();
				const upcomingAppointments = appointmentData.appointments?.filter(
					(a) => new Date(a.startAt) > now && a.status === 'booked'
				).length || 0;

				const upcomingEventsList = eventData.events?.filter(
					(e) => new Date(e.startDate) > now && e.status === 'scheduled'
				).length || 0;

				// Calculate revenue (sum of confirmed appointments * service price)
				const revenue = appointmentData.appointments?.reduce((sum, a) => {
					if (a.status === 'confirmed' && a.serviceId?.price) {
						return sum + a.serviceId.price;
					}
					return sum;
				}, 0) || 0;

				setStats({
					staffCount: staffData.staff?.length || 0,
					customerCount: customerData.customers?.length || 0,
					upcomingAppointments,
					upcomingEvents: upcomingEventsList,
					totalRevenue: revenue,
				});
			} catch (error) {
				console.error('Error fetching owner dashboard data:', error);
			} finally {
				// noop
			}
		};

		if (token) fetchBusinessData();
	}, [token]);

	return (
		<div className="card dashboard-card">
			<div className="dashboard-header">
				<div>
					<p className="eyebrow">Business Overview</p>
					<h2>Owner Dashboard</h2>
					<p>
						Welcome {user?.name} — {business?.name || 'Your Business'}
					</p>
				</div>
				<Link to="/businesses" className="btn small">
					Manage Business
				</Link>
			</div>

			<div className="dashboard-grid">
				<div className="dashboard-stat-card highlight">
					<div className="stat-content">
						<h3>Revenue (Confirmed)</h3>
						<p className="stat-number">${stats.totalRevenue.toFixed(2)}</p>
						<small>From confirmed appointments</small>
					</div>
				</div>

				<div className="dashboard-stat-card">
					<div className="stat-content">
						<h3>Staff Members</h3>
						<p className="stat-number">{stats.staffCount}</p>
						<Link to="/staff" className="stat-link">
							Manage staff
						</Link>
					</div>
				</div>

				<div className="dashboard-stat-card">
					<div className="stat-content">
						<h3>Customers</h3>
						<p className="stat-number">{stats.customerCount}</p>
						<Link to="/customers" className="stat-link">
							View customers
						</Link>
					</div>
				</div>

				<div className="dashboard-stat-card">
					<div className="stat-content">
						<h3>Upcoming Appointments</h3>
						<p className="stat-number">{stats.upcomingAppointments}</p>
						<Link to="/appointments" className="stat-link">
							View bookings
						</Link>
					</div>
				</div>

				<div className="dashboard-stat-card">
					<div className="stat-content">
						<h3>Upcoming Events</h3>
						<p className="stat-number">{stats.upcomingEvents}</p>
						<Link to="/events" className="stat-link">
							View events
						</Link>
					</div>
				</div>
			</div>

			<div className="quick-grid">
				<Link to="/staff" className="quick-card">
					<strong>Manage Staff</strong>
					<span>Add, edit, and manage team members.</span>
				</Link>
				<Link to="/services" className="quick-card">
					<strong>Services</strong>
					<span>Create and manage business services.</span>
				</Link>
				<Link to="/customers" className="quick-card">
					<strong>Customers</strong>
					<span>Review customer records and contacts.</span>
				</Link>
				<Link to="/appointments" className="quick-card">
					<strong>Appointments</strong>
					<span>Manage bookings and schedules.</span>
				</Link>
				<Link to="/events" className="quick-card">
					<strong>Events</strong>
					<span>Create and manage group events.</span>
				</Link>
				<Link to="/profile" className="quick-card">
					<strong>Settings</strong>
					<span>Update your profile and preferences.</span>
				</Link>
			</div>
		</div>
	);
};

export default DashboardOwner;
