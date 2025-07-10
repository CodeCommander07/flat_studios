// utils/permissions.js
export function hasAccessTo(page, role) {
  const accessMap = {
    hub: ['Staff', 'Community-Director', 'Human-Resources', "Operations-Manager", "Developer", 'Web-Developer', 'Owner'],
    hubPlus: ['Community-Director', 'Human-Resources', 'Web-Developer', 'Owner'],
    admin: ['Human-Resources', 'Web-Developer', 'Owner'],
    devPhase: ['Web-Developer'],
  };

  return accessMap[page]?.includes(role);
}
