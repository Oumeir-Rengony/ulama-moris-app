// Tier 3: component tokens for the tab bar. A stable hook if the active-tab style changes.
export const tabBar = {
  activeBg: 'bg-primary-subtle',     // pill behind the active tab
  activeFg: 'text-primary-subtle-fg', // active icon (+ label uses text-fg, ExtraBold)
  inactiveFg: 'text-fg-muted',
  divider: 'border-t border-border', // hairline above the bar
} as const;
