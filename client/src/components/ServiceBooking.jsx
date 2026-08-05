import { useEffect, useMemo, useState } from 'react';
import { createAppointment, getServiceSlots } from '../utils/api';

const formatDateInput = (date) => date.toISOString().split('T')[0];

const ServiceBooking = ({ service, token, customerId, onBooked }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [rangeStart, setRangeStart] = useState(formatDateInput(new Date()));

  useEffect(() => {
    const loadSlots = async () => {
      setLoading(true);
      setError(null);
      setSelectedSlot(null);
      try {
        const data = await getServiceSlots(service._id, token, { startDate: rangeStart, daysToShow: 7 });
        setSlots(data.slots || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (service?._id && token) {
      loadSlots();
    }
  }, [service?._id, token, rangeStart]);

  const groupedSlots = useMemo(() => {
    return slots.reduce((groups, slot) => {
      if (!groups[slot.date]) {
        groups[slot.date] = [];
      }
      groups[slot.date].push(slot);
      return groups;
    }, {});
  }, [slots]);

  const handleBooking = async () => {
    if (!selectedSlot) {
      setError('Choose a time slot before confirming the booking.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await createAppointment({
        customerId,
        serviceId: service._id,
        staffId: selectedSlot.staffId,
        startAt: selectedSlot.startAt,
        endAt: selectedSlot.endAt,
        notes,
      }, token);
      setNotes('');
      setSelectedSlot(null);
      if (onBooked) {
        onBooked(result.appointment || result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-panel">
      <div className="booking-panel-header">
        <div>
          <h3>Book {service.name}</h3>
          <p>{service.description || 'Choose a time that fits the staff availability for this service.'}</p>
        </div>
        <div className="booking-range-control">
          <label htmlFor={`range-start-${service._id}`}>Start date</label>
          <input
            id={`range-start-${service._id}`}
            type="date"
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value)}
          />
        </div>
      </div>

      {loading && <p>Loading available times...</p>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && slots.length === 0 && (
        <p>No slots are currently available for this service in the next 7 days.</p>
      )}

      {!loading && !error && slots.length > 0 && (
        <div className="slot-groups">
          {Object.entries(groupedSlots).map(([date, dateSlots]) => (
            <div key={date} className="slot-group">
              <h4>{new Date(`${date}T00:00:00`).toLocaleDateString()}</h4>
              <div className="slot-list">
                {dateSlots.map((slot) => {
                  const active = selectedSlot?.startAt === slot.startAt && selectedSlot?.staffId === slot.staffId;
                  return (
                    <button
                      key={`${slot.staffId}-${slot.startAt}`}
                      type="button"
                      className={`slot-button${active ? ' active' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <span>{slot.startTime}</span>
                      <small>{slot.staffName}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="booking-confirmation">
        <div>
          <strong>Selected slot</strong>
          <p>
            {selectedSlot
              ? `${new Date(selectedSlot.startAt).toLocaleString()} with ${selectedSlot.staffName}`
              : 'Choose one of the available times above.'}
          </p>
        </div>
        <div className="form-control">
          <label>Notes for the booking</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note for the staff" />
        </div>
        <button className="btn" type="button" disabled={!selectedSlot || submitting} onClick={handleBooking}>
          {submitting ? 'Confirming...' : 'Confirm booking'}
        </button>
      </div>
    </div>
  );
};

export default ServiceBooking;