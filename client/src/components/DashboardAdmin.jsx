import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils/api';

/**
 * DashboardAdmin - Admin dashboard with business metrics and management
 * Shows: This week appointments/events, staff/customer counts, system overview
 */
const DashboardAdmin = ({ user, token }) => {
	const [stats, setStats] = useState({
		thisWeekAppointments: 0,
		thisWeekEvents: 0,
		staffCount: 0,
		customerCount: 0,
		totalAppointments: 0,
	});

	useEffect(() => {
		const fetchAdminData = async () => {
			try {
				// Fetch appointments
				const appointmentRes = await fetchWithAuth('/api/appointments', token);
				const appointmentData = await appointmentRes.json();

				// Fetch events
				const eventRes = await fetchWithAuth('/api/events', token);
				const eventData = await eventRes.json();

				// Fetch staff
				const staffRes = await fetchWithAuth('/api/staff', token);
				const staffData = await staffRes.json();

				// Fetch customers
				const customerRes = await fetchWithAuth('/api/customers', token);
				const customerData = await customerRes.json();

				// Calculate this week's appointments
				const now = new Date();
				const weekStart = new Date(now);
				weekStart.setDate(now.getDate() - now.getDay());
				weekStart.setHours(0, 0, 0, 0);

				const weekEnd = new Date(weekStart);
				weekEnd.setDate(weekStart.getDate() + 7);

				const thisWeekAppointments = appointmentData.appointments?.filter((a) => {
					const apptDate = new Date(a.startAt);
					return apptDate >= weekStart && apptDate < weekEnd;
				}).length || 0;

				const thisWeekEvents = eventData.events?.filter((e) => {
					const eventDate = new Date(e.startDate);
					return eventDate >= weekStart && eventDate < weekEnd && e.status === 'scheduled';
				}).length || 0;

				setStats({
					thisWeekAppointments,
					thisWeekEvents,
					staffCount: staffData.staff?.length || 0,
					customerCount: customerData.customers?.length || 0,
					totalAppointments: appointmentData.appointments?.length || 0,
				});
			} catch (error) {
				console.error('Error fetching admin dashboard data:', error);
			} finally {
				// noop
			}
		};

		if (token) fetchAdminData();
	}, [token]);

	return (
		<div className="card dashboard-card">
			<div className="dashboard-header">
				<div>
					<p className="eyebrow">Business Management</p>
					<h2>Admin Dashboard</h2>
					<p>Welcome {user?.name} — This week's activity and business metrics.</p>
				</div>
				<Link to="/businesses" className="btn small">
					Business Settings
				</Link>
			</div>

			<div className="dashboard-grid">
				<div className="dashboard-stat-card highlight">
					<div className="stat-content">
						<h3>This Week's Appointments</h3>
						<p className="stat-number">{stats.thisWeekAppointments}</p>
						<Link to="/appointments" className="stat-link">
							View schedule
						</Link>
					</div>
				</div>

				<div className="dashboard-stat-card">
					<div className="stat-content">
						<h3>This Week's Events</h3>
						<p className="stat-number">{stats.thisWeekEvents}</p>
						<Link to="/events" className="stat-link">
							View events
						</Link>
					</div>
				</div>

				<div className="dashboard-stat-card">
					<div className="stat-content">
						<h3>Staff Members</h3>
						<p className="stat-number">{stats.staffCount}</p>
						<Link to="/staff" className="stat-link">
							Manage team
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
						<h3>Total Appointments</h3>
						<p className="stat-number">{stats.totalAppointments}</p>
						<small>All-time bookings</small>
					</div>
				</div>
			</div>

			<div className="quick-grid">
				<Link to="/staff" className="quick-card">
					<strong>Manage Staff</strong>
					<span>Add, edit, and manage team members.</span>
				</Link>
				<Link to="/services" className="quick-card">
					<strong>Manage Services</strong>
					<span>Create and configure services.</span>
				</Link>
				<Link to="/customers" className="quick-card">
					<strong>Customer List</strong>
					<span>Review all customer records.</span>
				</Link>
				<Link to="/appointments" className="quick-card">
					<strong>Schedule</strong>
					<span>View and manage all appointments.</span>
				</Link>
				<Link to="/events" className="quick-card">
					<strong>Events</strong>
					<span>Create and manage group events.</span>
				</Link>
				<Link to="/businesses" className="quick-card">
					<strong>Business Settings</strong>
					<span>Configure business details.</span>
				</Link>
			</div>
		</div>
	);
};

export default DashboardAdmin;
