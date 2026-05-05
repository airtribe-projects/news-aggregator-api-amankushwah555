module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    jwtExpiresIn: '1h',
    bcryptRounds: 10,
    newsApiKey: process.env.NEWS_API_KEY || '',
    newsApiUrl: 'https://newsapi.org/v2/top-headlines',
    newsCacheTtlMs: 5 * 60 * 1000,
};
