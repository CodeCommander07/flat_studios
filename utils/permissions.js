// utils/permissions.js
export function hasAccessTo(page, role) {
  const accessMap = {
    ycc:['Operator', 'Human-Resources', 'Web-Developer', 'Owner'],
    hub: ['Staff', 'Community-Director', 'Human-Resources', "Operations-Manager", "Developer", 'Web-Developer', 'Owner'],
    hubPlus: ['Community-Director', 'Human-Resources', 'Web-Developer', 'Owner'],
    admin: ['Human-Resources', 'Web-Developer', 'Owner'],
    dev: ['Human-Resources', 'Developer', 'Web-Developer', 'Owner'],
    devPhase: ['Web-Developer'],
  };

  return accessMap[page]?.includes(role);
}
