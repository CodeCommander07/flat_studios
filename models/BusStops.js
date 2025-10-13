import mongoose from 'mongoose';

const BusStopsSchema = new mongoose.Schema({
    stopId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    town: { type: String, required: true },
    facilities: { type: [String], default: [] },
    routes: { type: [String], default: [] }, // Array of routeIds
    branding:{ type: String },
    notes:{ type: String },
});

export default mongoose.models.BusStops ||
  mongoose.model('BusStops', BusStopsSchema);
