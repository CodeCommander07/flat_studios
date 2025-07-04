// utils/permissions.js
export function hasAccessTo(page, role) {
  const accessMap = {
    hub: ['Staff', 'Community-Director', 'High-Rank', "Operations-Manager", "Developer", 'Web-Developer'],
    hubPlus: ['Community-Director', 'High-Rank', 'Web-Developer'],
    admin: ['High-Rank', 'Web-Developer'],
  };

  return accessMap[page]?.includes(role);
}
