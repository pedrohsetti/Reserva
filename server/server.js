const express = require('express')
const dotenv = require('dotenv').config()

import logger from './middleware/logger.js';
import errorHandler from './middleware/error.js';
import notFound from './middleware/notFound.js';

const port = process.env.PORT || 5000

const app = express()


app.listen(port, () => console.log(`Server started on port ${port}`))
