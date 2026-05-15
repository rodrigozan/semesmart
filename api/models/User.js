import mongoose from 'mongoose';

const toJSON = {
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
};

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
  },
  avatar: {
    type: String, // URL da foto Google
  },
  role: {
    type: String,
    enum: ['owner', 'member'],
    default: 'member',
  },
  profiles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { toJSON });

const User = mongoose.model('User', userSchema);

export default User;
