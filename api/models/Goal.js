import mongoose from 'mongoose';

const toJSON = {
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
};

const goalSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true,
  },
  targetAmount: {
    type: Number,
    required: true,
  },
  currentAmount: {
    type: Number,
    default: 0,
  },
  deadline: {
    type: Date,
  },
  illustration: {
    type: String,
    default: '🎯',
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { toJSON });

goalSchema.index({ profile: 1 });

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;
