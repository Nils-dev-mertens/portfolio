// Test preload — runs before every test file so env vars are set before
// `@portfolio/data` (and the API routes) are imported for the first time.
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.AUTH_SECRET = 'test-secret-key';
process.env.AUTH_PASSWORD = 'test-password-123';
process.env.GITHUB_TOKEN = '';
process.env.GITHUB_USERNAME = '';
