import mongoose from 'mongoose';

const toJSON = {
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
};

const transactionSchema = new mongoose.Schema({
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
    enum: ['income', 'expense'],
    required: true,
  },
  amount: {
    type: Number,
    required: true, // always positive
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
  },
  paymentMethod: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  month: {
    type: Number,
  },
  year: {
    type: Number,
  },
  location: {
    type: String,
  },
  incomeSource: {
    type: String,
  },
  tags: [String],
  source: {
    type: String,
    enum: ['manual', 'import'],
    default: 'manual',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { toJSON });

transactionSchema.index({ profile: 1, date: -1 });
transactionSchema.index({ profile: 1, month: 1, year: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
