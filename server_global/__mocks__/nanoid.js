module.exports = {
  customAlphabet: (alphabet, size) => {
    return () => {
      const chars = alphabet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let id = '';
      for (let i = 0; i < (size || 21); i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return id;
    };
  }
};