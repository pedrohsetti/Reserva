import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils/api';

/**
 * DashboardCustomer - Customer dashboard with their bookings and interests
 * Shows: My appointments, registered events, recommended services, recent activity
 */
const DashboardCustomer = ({ user, token }) => {
	const [stats, setStats] = useState({
		myAppointments: 0,
		upcomingAppointments: 0,
		registeredEvents: 0,
		availableServices: 0,
	});
	const [upcomingAppointments, setUpcomingAppointments] = useState([]);

	useEffect(() => {
		const fetchCustomerData = async () => {
			try {
				// Fetch appointments
				const appointmentRes = await fetchWithAuth('/api/appointments', token);
				const appointmentData = await appointmentRes.json();

				// Filter user's appointments
				const userAppointments = appointmentData.appointments || [];

				// Separate upcoming from past
				const now = new Date();
				const upcoming = userAppointments.filter((a) => new Date(a.startAt) > now);

				setUpcomingAppointments(upcoming.slice(0, 5)); // Show next 5

				// Fetch services
				const serviceRes = await fetchWithAuth('/api/services', token);
				const serviceData = await serviceRes.json();

				// Fetch events
				const eventRes = await fetchWithAuth('/api/events', token);
				const eventData = await eventRes.json();

				// Filter registered events
				const registeredEvents = eventData.events?.filter((e) => {
					return e.registeredUsers?.some(
						(r) => String(r.customerId?._id || r.customerId) === String(user?.id) && r.status !== 'cancelled'
					);
				}).length || 0;

				setStats({
					myAppointments: userAppointments.length,
					upcomingAppointments: upcoming.length,
					registeredEvents,
					availableServices: serviceData.services?.length || 0,
				});
			} catch (error) {
				console.error('Error fetching customer dashboard data:', error);
			} finally {
				// noop
			}
		};

		if (token) fetchCustomerData();
	}, [token, user?.id]);

	return (
		<div className="card dashboard-card">
			<div className="dashboard-header">
				<div>
					<p className="eyebrow">My Bookings</p>
					<h2>Customer Dashboard</h2>
					<p>Welcome {user?.name}. Book services and keep track of your upcoming appointments.</p>
				</div>
				<div className="page-actions">
					<Link to="/services" className="btn small">Book a Service</Link>
					<Link to="/appointments" className="btn small secondary-btn">View Appointments</Link>
				</div>
			</div>

			<div className="dashboard-grid customer-summary-grid">
				<div className="dashboard-stat-card highlight compact-card">
					<div className="stat-content">
						<h3>Upcoming Appointments</h3>
						<p className="stat-number">{stats.upcomingAppointments}</p>
						<Link to="/appointments" className="stat-link">
							View bookings
						</Link>
					</div>
				</div>

				<div className="dashboard-stat-card compact-card">
					<div className="stat-content">
						<h3>Total Bookings</h3>
						<p className="stat-number">{stats.myAppointments}</p>
						<small>All past and future</small>
					</div>
				</div>

				<div className="dashboard-stat-card compact-card">
					<div className="stat-content">
						<h3>Available Services</h3>
						<p className="stat-number">{stats.availableServices}</p>
						<Link to="/services" className="stat-link">
							Browse services
						</Link>
					</div>
				</div>
			</div>

			{/* Upcoming Appointments Preview */}
			{upcomingAppointments.length > 0 && (
				<div className="dashboard-section">
					<h3>Your Upcoming Appointments</h3>
					<div className="appointment-list">
						{upcomingAppointments.map((appt) => (
							<div key={appt._id} className="appointment-item">
								<div className="appt-time">
									{new Date(appt.startAt).toLocaleDateString()} at{' '}
									{new Date(appt.startAt).toLocaleTimeString([], {
										hour: '2-digit',
										minute: '2-digit',
									})}
								</div>
								<div className="appt-info">
									<strong>{appt.serviceId?.name || 'Service'}</strong>
									<small>
										with {appt.staffId?.name || 'Staff Member'}
									</small>
								</div>
								<div className="appt-status">
									<span className={`badge badge-${appt.status}`}>{appt.status}</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="inline-link-row">
				<Link to="/events">Events</Link>
			</div>
		</div>
	);
};

export default DashboardCustomer;
