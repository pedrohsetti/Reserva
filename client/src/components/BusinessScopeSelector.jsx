import { useMemo, useState } from 'react';

const BusinessScopeSelector = ({ businesses = [], selectedBusinessId, onChange, title = 'Business scope', description = 'Choose a business to manage its staff, services, events, and appointments.' }) => {
	const [query, setQuery] = useState('');

	const filteredBusinesses = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		if (!normalizedQuery) {
			return businesses;
		}

		return businesses.filter((business) => {
			const haystack = [business.name, business.slug, business.email, business.phone]
				.filter(Boolean)
				.join(' ')
				.toLowerCase();
			return haystack.includes(normalizedQuery);
		});
	}, [businesses, query]);

	return (
		<div className="profile-section">
			<div className="section-header">
				<h3>{title}</h3>
			</div>
			<p>{description}</p>
			<div className="form-control">
				<label>Search businesses</label>
				<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, slug, email, or phone" />
			</div>
			<div className="form-control">
				<label>Select business</label>
				<select value={selectedBusinessId || ''} onChange={(event) => onChange(event.target.value)}>
					<option value="">Choose a business</option>
					{filteredBusinesses.map((business) => (
						<option key={business._id} value={business._id}>
							{business.name}
						</option>
					))}
				</select>
			</div>
			{selectedBusinessId && (
				<p>
					Managing {businesses.find((business) => business._id === selectedBusinessId)?.name || 'selected business'}.
				</p>
			)}
		</div>
	);
};

export default BusinessScopeSelector;