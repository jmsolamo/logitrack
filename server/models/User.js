import mongoose from 'mongoose';
<<<<<<< HEAD
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
=======

const userSchema = new mongoose.Schema({
  firebaseUid: {
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
    type: String,
    required: true,
    unique: true
  },
<<<<<<< HEAD
  password: {
    type: String,
    required: true
  },
  plainPassword: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    required: true,
    default: 'user'
=======
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  initials: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    required: true
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
  }
}, {
  timestamps: true
});

<<<<<<< HEAD
// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

=======
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
export default mongoose.model('User', userSchema);
