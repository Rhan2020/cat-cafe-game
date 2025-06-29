// A fully featured mock for wx-server-sdk

// Store all mock functions in a single object to facilitate resetting them
const allMocks = {
    // Database-level mocks
    db: {
        collection: jest.fn(),
        serverDate: jest.fn(() => new Date()),
        runTransaction: jest.fn(),
        command: {
            inc: jest.fn(val => ({ _internalType: 'inc', value: val })),
            set: jest.fn(val => val), // Mimic the behavior for tests
        },
    },
    // Collection-level mocks (these are the results of collection())
    collections: {
        users: {
            add: jest.fn(),
            doc: jest.fn(),
            where: jest.fn(),
            get: jest.fn(),
            update: jest.fn(),
        },
        animals: {
            add: jest.fn(),
            doc: jest.fn(),
            where: jest.fn(),
            get: jest.fn(),
            update: jest.fn(),
        },
        game_configs: {
            add: jest.fn(),
            doc: jest.fn(),
            where: jest.fn(),
            get: jest.fn(),
            update: jest.fn(),
        },
    },
    // Document/Query-level mocks (these are the results of doc() or where())
    queries: {
        get: jest.fn(),
        update: jest.fn(),
    },
    // Top-level cloud functions
    cloud: {
        init: jest.fn(),
        getWXContext: jest.fn(() => ({
            OPENID: 'test-openid',
            APPID: 'test-appid',
            UNIONID: 'test-unionid',
        })),
        database: jest.fn(),
    },
};

// --- Wire up the mocks to simulate the chained API calls ---

// cloud.database() returns the mock database
allMocks.cloud.database.mockReturnValue(allMocks.db);

// db.collection('name') returns the corresponding mock collection
allMocks.db.collection.mockImplementation(name => allMocks.collections[name]);

// For every mock collection, make .doc() and .where() return the mock query object
Object.values(allMocks.collections).forEach(collection => {
    const mockQuery = {
        get: allMocks.queries.get,
        update: allMocks.queries.update,
    };
    collection.doc.mockReturnValue(mockQuery);
    collection.where.mockReturnValue(mockQuery);
});


// --- Control functions for tests ---

/**
 * Resets all mock functions to their default empty state.
 * Crucially, this should be called in `beforeEach` in test files.
 */
const clearAllMocks = () => {
    allMocks.cloud.getWXContext.mockReturnValue({
        OPENID: 'test-openid',
        APPID: 'test-appid',
        UNIONID: 'test-unionid',
    });

    allMocks.queries.get.mockReset();
    allMocks.queries.update.mockReset();

    Object.values(allMocks.collections).forEach(collection => {
        collection.add.mockReset();
        collection.doc.mockClear(); // .mockClear() because we don't want to lose the mockReturnValue setup
        collection.where.mockClear();
        collection.get.mockReset();
        collection.update.mockReset();
    });
};

// Set default "happy path" resolutions. Tests can override these.
clearAllMocks();


// --- Export the top-level mock and the control functions ---

module.exports = {
    ...allMocks.cloud,
    _mocks: allMocks,
    _clearAllMocks: clearAllMocks,
}; 