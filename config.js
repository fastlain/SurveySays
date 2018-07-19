exports.DATABASE_URL = process.env.DATABASE_URL ||
                      'mongodb://localhost:27017/surveysays';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ||
                      'mongodb://localhost/test-surveysays';
exports.PORT = process.env.PORT || 8080;