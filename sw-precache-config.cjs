module.exports = {
  staticFileGlobs: [
    'public/images/**',
    '!public/service-worker.js',
    'public/**.js'
  ],
  root: 'public',
  stripPrefix: 'public/'
};
