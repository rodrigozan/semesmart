import mongoose from 'mongoose';

const toJSON = {
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
};

const profileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      canWrite: {
        type: Boolean,
        default: true,
      },
    },
  ],
  avatar: {
    type: String,
    default: '💰',
  },
  color: {
    type: String,
    default: '#7B2FBE',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { toJSON });

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
