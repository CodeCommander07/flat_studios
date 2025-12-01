import { useEffect, useRef, useState } from 'react';
import axios from "axios";

export default function useServerData(serverId) {
  const [serverMeta, setServerMeta] = useState(null);
  const [players, setPlayers] = useState([]);
  const [chatLogs, setChatLogs] = useState([]);
  const [modLogs, setModLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const robloxCache = useRef({});

  async function getRobloxInfo(id) {
    if (robloxCache.current[id]) return robloxCache.current[id];

    try {
      const res = await axios.get(`/api/roblox/${id}`);
      const info = {
        username: res.data.username,
        icon: res.data.icon,
        rank: res.data.group.rank,
        role: res.data.group.role
      };
      robloxCache.current[id] = info;
      return info;
    } catch {
      return {
        username: "System",
        icon: "https://yapton.flatstudios.net/cdn/image/black_logo.png",
        rank: 0,
        role: "Automation"
      };
    }
  }

  async function loadAll() {
    if (!serverId) return;

    const [metaRes, playersRes, chatRes, auditRes] = await Promise.all([
      axios.get(`/api/game/servers/${serverId}`),
      axios.get(`/api/game/servers/${serverId}/players`),
      axios.get(`/api/game/servers/${serverId}/chat`),
      axios.get(`/api/game/servers/${serverId}/audit`)
    ]);

    setServerMeta(metaRes.data);

    const mappedPlayers = await Promise.all(
      (playersRes.data || []).map(async (p) => {
        const info = await getRobloxInfo(p.playerId);
        return {
          ...p,
          username: info.username,
          icon: info.icon,
          role: info.role,
          rank: info.rank
        };
      })
    );

    const mappedChat = await Promise.all(
      (chatRes.data || []).map(async (m) => {
        const info = await getRobloxInfo(m.playerId);
        return {
          ...m,
          username: info.username,
          icon: info.icon,
          role: info.role,
          rank: info.rank
        };
      })
    );

    setPlayers(mappedPlayers);
    setChatLogs(mappedChat);
    setAuditLogs(auditRes.data);
  }

  async function loadModLogs() {
    if (!serverId) return;
    const res = await axios.get(`/api/moderation/log?serverId=${serverId}`);
    setModLogs(res.data.logs || []);
  }

  useEffect(() => {
    if (!serverId) return;
    (async () => {
      setLoading(true);
      await loadAll();
      await loadModLogs();
      setLoading(false);
    })();

    const interval = setInterval(() => {
      loadAll();
      loadModLogs();
    }, 30000);

    return () => clearInterval(interval);
  }, [serverId]);

  return { loading, serverMeta, players, chatLogs, modLogs, auditLogs};
}
