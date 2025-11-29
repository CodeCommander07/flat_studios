import { Bus } from 'lucide-react';

export default function VehicleLogs({ vehicles }) {
  return (
    <div className="bg-[#283335]/80 border border-white/10 rounded-xl p-4">

      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <Bus size={20} /> Vehicle Logs ({vehicles.length})
      </h2>

      {vehicles.length === 0 && (
        <p className="text-gray-400 text-sm">No active buses in this server.</p>
      )}

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {vehicles.map((v, i) => (
          <div
            key={i}
            className="border-b border-white/10 pb-3 flex gap-3"
          >
            <img src={v.icon} className="w-10 h-10 rounded-md mt-1" />

            <div>
              <p className="text-blue-300 font-semibold">{v['Vehicle Owner']}</p>

              <p className="text-sm text-gray-300">{v['Vehicle Type']}</p>

              <p className="text-xs text-gray-400">
                Livery: {v['Vehicle Livery']}
              </p>

              <p className="text-xs text-gray-400">
                Route: {v.Route} → {v.Destination}
              </p>

              <p className="text-xs text-gray-400">
                Location: {v['Current Location']}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Fleet: {v.VehicleInformation?.['Fleet Number']}
                {' — '}
                Model: {v.VehicleInformation?.['Top Model']}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
