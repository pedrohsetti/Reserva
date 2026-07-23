const Notification = require('../models/Notification');

async function createNotification(payload) {
	return Notification.create(payload);
}

async function sendAppointmentConfirmation({ businessId, recipientId, recipientType, relatedId, message }) {
	return createNotification({
		businessId,
		recipientId,
		recipientType,
		relatedType: 'Appointment',
		relatedId,
		type: 'confirmation',
		title: 'Appointment confirmed',
		message,
	});
}

async function sendEventConfirmation({ businessId, recipientId, recipientType, relatedId, message }) {
	return createNotification({
		businessId,
		recipientId,
		recipientType,
		relatedType: 'Event',
		relatedId,
		type: 'confirmation',
		title: 'Event registration confirmed',
		message,
	});
}

module.exports = {
	createNotification,
	sendAppointmentConfirmation,
	sendEventConfirmation,
};
