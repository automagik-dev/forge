const path = require('path');
const upstreamConfig = require('../upstream/frontend/tailwind.config.js');

const workspaceRoot = path.resolve(__dirname, '..');
const upstreamDir = path.resolve(workspaceRoot, 'upstream/frontend');
const overridesDir = path.resolve(workspaceRoot, 'forge-overrides/frontend');

const toAbsoluteGlob = (glob) => {
  if (glob.startsWith('./')) {
    return path.join(upstreamDir, glob.slice(2));
  }
  if (glob.startsWith('../')) {
    return path.resolve(upstreamDir, glob);
  }
  return glob;
};

module.exports = {
  ...upstreamConfig,
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{ts,tsx,js,jsx,mdx}'),
    ...((upstreamConfig.content ?? []).map(toAbsoluteGlob)),
    path.join(overridesDir, 'src/**/*.{ts,tsx,js,jsx,mdx}')
  ],
};
