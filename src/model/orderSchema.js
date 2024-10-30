const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      }
    }
  ],
  orderStatus: {
    type: String,
    enum: ['pending', 'in progress', 'delivered', 'canceled'],
    default: 'pending'
  },
  deliveryAddress: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
    }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
