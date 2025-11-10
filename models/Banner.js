import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema({
  active: { type: Boolean, default: false },
  message: { type: String, required: true },
  linkText: { type: String },
  linkUrl: { type: String },
  bgColor: { type: String, default: '#FFDD00' },   // example highlight color
  textColor: { type: String, default: '#000000' },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Banner || mongoose.model('Banner', BannerSchema);
