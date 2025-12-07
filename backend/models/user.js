const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  postcode: { type: String, required: true },
  line1: { type: String, required: true },
  line2: String,
  line3: String,
  town: { type: String, required: true },
});

const userSchema = new mongoose.Schema({
  firstName:    { type: String, required: true },
  lastName:     { type: String, required: true },
  email:        { type: String, required: true, unique: true },
  role:      { type: String, enum: ['client', 'partner','admin'], required: true },
  companyName: { type: String }, // Optional, only for partners
  address: { type: addressSchema, required: true },
  authProvider: { type: String, enum: ['local','google'], default: 'local' },
  isVerified: { type: Boolean, default: false },
  verifyCode: String,
  verifyCodeExpires: Date,
  password:     {
    type: String,
    required: function() { return this.authProvider === 'local'; }
  },
   // 👇 Add this field
  isActive: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now }
  
}, { collection: 'costa_de_saul_users' }); // 👈 force collection name

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


userSchema.methods.matchPassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.models.Costa_De_Saul_User || mongoose.model('Costa_De_Saul_User', userSchema);
module.exports = { User, userSchema };

