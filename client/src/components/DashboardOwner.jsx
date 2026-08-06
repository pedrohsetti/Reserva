import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils/api';

/**
 * DashboardOwner - Business owner dashboard with KPIs and metrics
 * Shows: Staff count, customer count, revenue, upcoming appointments/events
 */
const DashboardOwner = ({ user, token }) => {
	const [business, setBusiness] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [appointments, setAppointments] = useState([]);
	const [events, setEvents] = useState([]);
	const [services, setServices] = useState([]);
	const [staff, setStaff] = useState([]);
	const [customers, setCustomers] = useState([]);
	const [filters, setFilters] = useState({
		timeRange: 'all',
		serviceId: 'all',
		staffId: 'all',
		eventId: 'all',
	});
	const [stats, setStats] = useState({
		staffCount: 0,
		customerCount: 0,
		upcomingAppointments: 0,
		upcomingEvents: 0,
		appointmentRevenue: 0,
		eventRevenue: 0,
		totalRevenue: 0,
	});

	useEffect(() => {
		const fetchBusinessData = async () => {
			try {
				setLoading(true);
				setError('');
				// Fetch business info
				const businessRes = await fetchWithAuth('/api/businesses/me', token);
				if (!businessRes.ok) {
					throw new Error('Failed to load business');
				}
				const businessData = await businessRes.json();
				setBusiness(businessData.business);

				// Fetch staff
				const staffRes = await fetchWithAuth('/api/staff', token);
				if (!staffRes.ok) {
					throw new Error('Failed to load staff');
				}
				const staffData = await staffRes.json();

				// Fetch customers
				const customerRes = await fetchWithAuth('/api/customers', token);
				if (!customerRes.ok) {
					throw new Error('Failed to load customers');
				}
				const customerData = await customerRes.json();

				// Fetch appointments
				const appointmentRes = await fetchWithAuth('/api/appointments', token);
				if (!appointmentRes.ok) {
					throw new Error('Failed to load appointments');
				}
				const appointmentData = await appointmentRes.json();

				// Fetch events
				const eventRes = await fetchWithAuth('/api/events', token);
				if (!eventRes.ok) {
					throw new Error('Failed to load events');
				}
				const eventData = await eventRes.json();

				setStaff(staffData.staff || []);
				setCustomers(customerData.customers || []);
				setAppointments(appointmentData.appointments || []);
				setEvents(eventData.events || []);
				setServices((appointmentData.appointments || [])
					.map((item) => item.serviceId)
					.filter(Boolean)
					.reduce((acc, service) => {
						const key = String(service._id || service.id || service);
						if (!acc.some((entry) => String(entry._id || entry.id || entry) === key)) {
							acc.push(service);
						}
						return acc;
					}, []));
			} catch (error) {
				console.error('Error fetching owner dashboard data:', error);
				setError(error.message || 'Failed to load dashboard');
			} finally {
				setLoading(false);
			}
		};

		if (token) fetchBusinessData();
	}, [token]);

	useEffect(() => {
		const now = new Date();

		const timeStart = (() => {
			if (filters.timeRange === '30d') {
				return new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
			}
			if (filters.timeRange === '90d') {
				return new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
			}
			if (filters.timeRange === '365d') {
				return new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
			}
			return null;
		})();

		const filteredAppointments = appointments.filter((item) => {
			const matchesService = filters.serviceId === 'all' || String(item.serviceId?._id || item.serviceId) === filters.serviceId;
			const matchesStaff = filters.staffId === 'all' || String(item.staffId?._id || item.staffId) === filters.staffId;
			const matchesTime = !timeStart || new Date(item.startAt) >= timeStart;
			return matchesService && matchesStaff && matchesTime;
		});

		const filteredEvents = events.filter((item) => {
			const matchesEvent = filters.eventId === 'all' || String(item._id) === filters.eventId;
			const matchesStaff = filters.staffId === 'all' || (item.staffIds || []).some((entry) => String(entry._id || entry) === filters.staffId);
			const matchesTime = !timeStart || new Date(item.startDate) >= timeStart;
			return matchesEvent && matchesStaff && matchesTime;
		});

		const appointmentRevenue = filteredAppointments.reduce((sum, item) => {
			if (!['confirmed', 'completed'].includes(item.status)) {
				return sum;
			}
			return sum + Number(item.serviceId?.price || 0);
		}, 0);

		const eventRevenue = filteredEvents.reduce((sum, item) => {
			const activeRegistrations = (item.registeredUsers || []).filter((entry) => entry.status !== 'cancelled').length;
			return sum + (Number(item.price || 0) * activeRegistrations);
		}, 0);

		const filteredCustomerIds = new Set();
		filteredAppointments.forEach((item) => {
			if (item.customerId?._id) {
				filteredCustomerIds.add(String(item.customerId._id));
			}
		});
		filteredEvents.forEach((event) => {
			(event.registeredUsers || []).forEach((registration) => {
				if (registration.status !== 'cancelled' && registration.customerId?._id) {
					filteredCustomerIds.add(String(registration.customerId._id));
				}
			});
		});

		const upcomingAppointments = filteredAppointments.filter(
			(item) => new Date(item.startAt) > now && ['booked', 'confirmed'].includes(item.status)
		).length;

		const upcomingEvents = filteredEvents.filter(
			(item) => new Date(item.startDate) > now && item.status === 'scheduled'
		).length;

		setStats({
			staffCount: staff.length,
			customerCount: filters.timeRange === 'all' && filters.serviceId === 'all' && filters.staffId === 'all' && filters.eventId === 'all'
				? customers.length
				: filteredCustomerIds.size,
			upcomingAppointments,
			upcomingEvents,
			appointmentRevenue,
			eventRevenue,
			totalRevenue: appointmentRevenue + eventRevenue,
		});
	}, [appointments, events, staff, customers, filters]);

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

			<div className="dashboard-filters" style={{ marginBottom: '1rem' }}>
				<div className="quick-grid">
					<div className="form-control">
						<label>Time</label>
						<select value={filters.timeRange} onChange={(event) => setFilters((prev) => ({ ...prev, timeRange: event.target.value }))}>
							<option value="all">All time</option>
							<option value="30d">Last 30 days</option>
							<option value="90d">Last 90 days</option>
							<option value="365d">Last 12 months</option>
						</select>
					</div>
					<div className="form-control">
						<label>Service</label>
						<select value={filters.serviceId} onChange={(event) => setFilters((prev) => ({ ...prev, serviceId: event.target.value }))}>
							<option value="all">All services</option>
							{services.map((service) => (
								<option key={service._id} value={service._id}>{service.name || 'Unnamed service'}</option>
							))}
						</select>
					</div>
					<div className="form-control">
						<label>Staff</label>
						<select value={filters.staffId} onChange={(event) => setFilters((prev) => ({ ...prev, staffId: event.target.value }))}>
							<option value="all">All staff</option>
							{staff.map((member) => (
								<option key={member._id} value={member._id}>{member.name || member.email}</option>
							))}
						</select>
					</div>
					<div className="form-control">
						<label>Event</label>
						<select value={filters.eventId} onChange={(event) => setFilters((prev) => ({ ...prev, eventId: event.target.value }))}>
							<option value="all">All events</option>
							{events.map((event) => (
								<option key={event._id} value={event._id}>{event.title || 'Untitled event'}</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{loading && <p>Loading dashboard metrics...</p>}
			{error && <div className="error">{error}</div>}
			{!loading && !error && (
				<>

			<div className="dashboard-grid">
				<div className="dashboard-stat-card highlight">
					<div className="stat-content">
						<h3>Total Revenue</h3>
						<p className="stat-number">${stats.totalRevenue.toFixed(2)}</p>
						<small>${stats.appointmentRevenue.toFixed(2)} appointments + ${stats.eventRevenue.toFixed(2)} events</small>
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
				</>
			)}
		</div>
	);
};

export default DashboardOwner;
