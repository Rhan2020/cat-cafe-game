const mockCollections = {
  users: {
    add: jest.fn().mockResolvedValue({ _id: 'new_user_id', errMsg: 'collection.add:ok' }),
    doc: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ data: [], errMsg: 'collection.get:ok' }),
    update: jest.fn().mockResolvedValue({ stats: { updated: 1 }, errMsg: 'document.update:ok' }),
  },
  animals: {
    doc: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ data: [], errMsg: 'collection.get:ok' }),
  },
  game_configs: {
    get: jest.fn().mockResolvedValue({ data: [], errMsg: 'collection.get:ok' }),
  }
};

const mockDb = {
  collection: jest.fn(name => mockCollections[name]),
  serverDate: jest.fn(() => new Date()),
  command: {
      inc: jest.fn(val => ({ _internalType: 'inc', value: val })),
  }
};

const mockCloud = {
  init: jest.fn(),
  getWXContext: jest.fn(() => ({
    OPENID: 'test_openid',
    APPID: 'test_appid',
    UNIONID: 'test_unionid',
  })),
  database: jest.fn(() => mockDb),
  // Exporting the individual mocks for better control in tests
  _mockDb: mockDb,
  _mockCollections: mockCollections,
};

module.exports = mockCloud; 