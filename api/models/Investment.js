import mongoose from 'mongoose';

const toJSON = {
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
};

const investmentSchema = new mongoose.Schema({
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['stock', 'fii', 'fixed_income', 'crypto', 'other'],
    required: true,
  },
  ticker: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  averagePrice: {
    type: Number,
    required: true,
  },
  currentPrice: {
    type: Number,
  },
  sector: {
    type: String,
  },
  broker: {
    type: String,
  },
  purchaseDate: {
    type: Date,
  },
  notes: {
    type: String,
  },
  updatedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { toJSON });

investmentSchema.index({ profile: 1 });

const Investment = mongoose.model('Investment', investmentSchema);

export default Investment;
