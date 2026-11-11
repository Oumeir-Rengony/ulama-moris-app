module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind v4 (DESIGN-SYSTEM.md §14). The React Compiler stays on through
    // app.json `experiments.reactCompiler`, which babel-preset-expo reads.
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
