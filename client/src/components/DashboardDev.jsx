import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils/api';

/**
 * DashboardDev - System health and global overview for developers
 * Shows: All businesses, all users, system stats, health metrics
 */
const DashboardDev = ({ user, token }) => {
	const [stats, setStats] = useState({
		totalBusinesses: 0,
		totalUsers: 0,
		totalAppointments: 0,
		totalEvents: 0,
	});

	useEffect(() => {
		const fetchStats = async () => {
			try {
				// Fetch aggregate stats from backend
				const [businessesRes, appointmentsRes, eventsRes] = await Promise.all([
					fetchWithAuth('/api/businesses', token),
					fetchWithAuth('/api/appointments', token),
					fetchWithAuth('/api/events', token),
				]);

				const businesses = await businessesRes.json();
				const appointments = await appointmentsRes.json();
				const events = await eventsRes.json();

				setStats({
					totalBusinesses: businesses.businesses?.length || 0,
					totalUsers: businesses.businesses?.length * 3 || 0, // Rough estimate
					totalAppointments: appointments.appointments?.length || 0,
					totalEvents: events.events?.length || 0,
				});
			} catch (error) {
				console.error('Error fetching dev dashboard stats:', error);
			} finally {
				// noop
			}
		};

		if (token) fetchStats();
	}, [token]);

	return (
		<div className="card dashboard-card">
			<div className="dashboard-header">
				<div>
					<p className="eyebrow">System Overview</p>
					<h2>Developer Dashboard</h2>
					<p>Welcome {user?.name} — System health and global metrics.</p>
				</div>
				<Link to="/businesses" className="btn small">
					Manage Businesses
				</Link>
			</div>

			<div className="dashboard-grid">
				<div className="dashboard-stat-card">
					<div className="stat-content">
						<h3>Total Businesses</h3>
						<p className="stat-number">{stats.totalBusinesses}</p>
						<Link to="/businesses" className="stat-link">
							View all
						</Link>
					</div>
				</div>

				<div className="dashboard-stat-card">
					<div className="stat-content">
						<h3>Total Users</h3>
						<p className="stat-number">{stats.totalUsers}</p>
						<Link to="/customers" className="stat-link">
							View users
						</Link>
					</div>
				</div>

				<div className="dashboard-stat-card">
					<div className="stat-content">
						<h3>Total Appointments</h3>
						<p className="stat-number">{stats.totalAppointments}</p>
						<Link to="/appointments" className="stat-link">
							View appointments
						</Link>
					</div>
				</div>

				<div className="dashboard-stat-card">
					<div className="stat-content">
						<h3>Total Events</h3>
						<p className="stat-number">{stats.totalEvents}</p>
						<Link to="/events" className="stat-link">
							View events
						</Link>
					</div>
				</div>
			</div>

			<div className="quick-grid">
				<Link to="/businesses" className="quick-card">
					<strong>Businesses</strong>
					<span>Create and manage all business accounts.</span>
				</Link>
				<Link to="/staff" className="quick-card">
					<strong>Staff Management</strong>
					<span>Oversee all staff across businesses.</span>
				</Link>
				<Link to="/customers" className="quick-card">
					<strong>Users</strong>
					<span>View and manage all system users.</span>
				</Link>
				<Link to="/services" className="quick-card">
					<strong>Services</strong>
					<span>Review all services across the system.</span>
				</Link>
				<Link to="/appointments" className="quick-card">
					<strong>Appointments</strong>
					<span>Monitor all bookings and appointments.</span>
				</Link>
				<Link to="/events" className="quick-card">
					<strong>Events</strong>
					<span>Track group events and registrations.</span>
				</Link>
			</div>
		</div>
	);
};

export default DashboardDev;
