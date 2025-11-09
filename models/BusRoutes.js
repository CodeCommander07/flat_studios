import mongoose from 'mongoose';

const BusRoutesSchema = new mongoose.Schema({
  routeId: { type: String, required: true, unique: true },
  operator: { type: String, required: true },
  number: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  stops: { type: [String], default: [] }, // Array of stopIds
  stopsReverse: { type: [String], default: [] }, // Array of stopIds
  description: { type: String },

  // 🚧 Diversion details
  diversion: {
    active: { type: Boolean, default: false },
    reason: { type: String, default: '' },
    stops: { type: [String], default: [] }, // affected stops or altered route
  },

  map: {
    data: Buffer,
    contentType: String,
    filename: String,
  },
});

export default mongoose.models.BusRoutes ||
  mongoose.model('BusRoutes', BusRoutesSchema);
