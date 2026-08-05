import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils/api';

/**
 * DashboardStaff - Staff member dashboard with their appointments and schedule
 * Shows: Today's appointments, my services, my working hours, my customers
 */
const DashboardStaff = ({ user, token }) => {
	const [stats, setStats] = useState({
		todayAppointments: 0,
		upcomingAppointments: 0,
		totalServices: 0,
		totalCustomers: 0,
	});
	const [todayAppointments, setTodayAppointments] = useState([]);

	useEffect(() => {
		const fetchStaffData = async () => {
			try {
				const staffRes = await fetchWithAuth('/api/staff/me', token);
				const staffData = await staffRes.json();
				const currentStaff = staffData.staff;

				if (currentStaff) {
					// Fetch appointments
					const appointmentRes = await fetchWithAuth('/api/appointments', token);
					const appointmentData = await appointmentRes.json();

					// Filter today's appointments
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const tomorrow = new Date(today);
					tomorrow.setDate(tomorrow.getDate() + 1);

					const todaysAppointments = appointmentData.appointments?.filter((a) => {
						const apptDate = new Date(a.startAt);
						return apptDate >= today && apptDate < tomorrow;
					}) || [];

					const upcomingAppointments = appointmentData.appointments?.filter((a) => {
						const apptDate = new Date(a.startAt);
						return apptDate >= tomorrow && a.status === 'booked';
					}).length || 0;

					setTodayAppointments(todaysAppointments);

					// Fetch services for this staff
					await fetchWithAuth('/api/services', token);

					// Fetch customers
					const customerRes = await fetchWithAuth('/api/customers', token);
					const customerData = await customerRes.json();

					setStats({
						todayAppointments: todaysAppointments.length,
						upcomingAppointments,
						totalServices: currentStaff.serviceIds?.length || 0,
						totalCustomers: customerData.customers?.length || 0,
					});
				}
			} catch (error) {
				console.error('Error fetching staff dashboard data:', error);
			} finally {
				// noop
			}
		};

		if (token) fetchStaffData();
	}, [token]);

	return (
		<div className="card dashboard-card">
			<div className="dashboard-header">
				<div>
					<p className="eyebrow">My Schedule</p>
					<h2>Staff Dashboard</h2>
					<p>Welcome {user?.name} — Manage your appointments and hours.</p>
				</div>
				<Link to="/profile" className="btn small">
					My Profile
				</Link>
			</div>

			<div className="dashboard-grid">
				<div className="dashboard-stat-card highlight">
					<div className="stat-content">
						<h3>Today's Appointments</h3>
						<p className="stat-number">{stats.todayAppointments}</p>
						<small>Bookings for today</small>
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
						<h3>My Services</h3>
						<p className="stat-number">{stats.totalServices}</p>
						<Link to="/services" className="stat-link">
							Manage services
						</Link>
					</div>
				</div>

				<div className="dashboard-stat-card">
					<div className="stat-content">
						<h3>My Customers</h3>
						<p className="stat-number">{stats.totalCustomers}</p>
						<Link to="/customers" className="stat-link">
							View customers
						</Link>
					</div>
				</div>
			</div>

			{/* Today's Appointments List */}
			{todayAppointments.length > 0 && (
				<div className="dashboard-section">
					<h3>Today's Appointments</h3>
					<div className="appointment-list">
						{todayAppointments.map((appt) => (
							<div key={appt._id} className="appointment-item">
								<div className="appt-time">
									{new Date(appt.startAt).toLocaleTimeString([], {
										hour: '2-digit',
										minute: '2-digit',
									})}
								</div>
								<div className="appt-info">
									<strong>{appt.customerId?.name || 'Customer'}</strong>
									<small>{appt.serviceId?.name || 'Service'}</small>
								</div>
								<div className="appt-status">
									<span className={`badge badge-${appt.status}`}>{appt.status}</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="quick-grid">
				<Link to="/appointments" className="quick-card">
					<strong>My Appointments</strong>
					<span>View and manage your bookings.</span>
				</Link>
				<Link to="/profile" className="quick-card">
					<strong>My Hours</strong>
					<span>Set and edit your working hours.</span>
				</Link>
				<Link to="/customers" className="quick-card">
					<strong>My Customers</strong>
					<span>View customers for your services.</span>
				</Link>
				<Link to="/services" className="quick-card">
					<strong>My Services</strong>
					<span>Manage your service offerings.</span>
				</Link>
				<Link to="/events" className="quick-card">
					<strong>Events</strong>
					<span>View and manage group events.</span>
				</Link>
				<Link to="/profile" className="quick-card">
					<strong>My Profile</strong>
					<span>Update your contact information.</span>
				</Link>
			</div>
		</div>
	);
};

export default DashboardStaff;
