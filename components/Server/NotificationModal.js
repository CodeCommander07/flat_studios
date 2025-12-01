import { useState } from "react";
import axios from "axios";

export default function NotificationModal({ serverId, onClose }) {
  const [message, setMessage] = useState("");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#283335] border border-white/10 rounded-xl p-6 w-full max-w-md text-white shadow-xl">
        <h2 className="text-xl font-bold mb-4">Send Notification</h2>

        <textarea
          className="w-full bg-black/20 border border-white/20 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="What's your notification?"
          maxLength={200}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="flex justify-end mt-4 gap-3">
          <button
            className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
            disabled={!message.trim()}
            onClick={async () => {
              await axios.post(`/api/game/servers/${serverId}/post`, {
                message,
                author: "Dashboard",
              });
              setMessage("");
              onClose();
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
