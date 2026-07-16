const mongoose = require('mongoose');

const paymentEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
    processedAt: {
      type: Date,
    },
    errorMessage: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PaymentEvent', paymentEventSchema);
