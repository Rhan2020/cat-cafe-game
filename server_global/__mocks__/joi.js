const chain = {};
const methods = [
  'string','number','valid','default','integer','min','uri','unknown','object','boolean','allow','required'
];
methods.forEach(m => {
  chain[m] = () => chain;
});
chain.validate = (value) => ({ value, error: null });
module.exports = chain;