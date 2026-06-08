export default {
  tag: 'date',
  fetch: () => `Current date/time: ${new Date().toLocaleString()}`,
};
