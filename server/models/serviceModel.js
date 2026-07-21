// service and event model

const mongoose = require('mongoose');

const serviceSchema = mongoose.Schema(
  {
    name: {
        type: String,
        required: [true, 'Please add a service name'],
    },
    description: {
        type: String,
        required: [true, 'Please add a service description'],
    },
    price: {
        type: Number,
        required: [true, 'Please add a service price'],
    },
    date: {
        type: Date,
        required: [true, 'Please add a service date'],
    },
    time: {
        type: Number,
        required: [true, 'Please add a service time'],
    },
    location: {
        type: String,
        required: [true, 'Please add a service location'],
    },
    tags: {
        type: [String],
        required: [true, 'Please add service tags'],
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Service', serviceSchema);