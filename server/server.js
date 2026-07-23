const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

async function start() {
	await connectDB();

	app.listen(env.PORT, () => {
		console.log(`Server started on port ${env.PORT}`);
	});
}

start().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
