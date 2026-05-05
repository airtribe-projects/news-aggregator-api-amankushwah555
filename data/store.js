const users = new Map();
const articles = new Map();

function getUserByEmail(email) {
    return users.get(email);
}

function createUser(user) {
    const record = {
        ...user,
        readArticles: new Set(),
        favoriteArticles: new Set(),
    };
    users.set(user.email, record);
    return record;
}

function updatePreferences(email, preferences) {
    const user = users.get(email);
    if (!user) return null;
    user.preferences = preferences;
    return user;
}

function saveArticles(list) {
    for (const article of list) {
        if (article && article.id) articles.set(article.id, article);
    }
}

function getArticleById(id) {
    return articles.get(id);
}

function markRead(email, articleId) {
    const user = users.get(email);
    if (!user) return null;
    if (!articles.has(articleId)) return null;
    user.readArticles.add(articleId);
    return user;
}

function markFavorite(email, articleId) {
    const user = users.get(email);
    if (!user) return null;
    if (!articles.has(articleId)) return null;
    user.favoriteArticles.add(articleId);
    return user;
}

function getReadArticles(email) {
    const user = users.get(email);
    if (!user) return null;
    return [...user.readArticles].map((id) => articles.get(id)).filter(Boolean);
}

function getFavoriteArticles(email) {
    const user = users.get(email);
    if (!user) return null;
    return [...user.favoriteArticles].map((id) => articles.get(id)).filter(Boolean);
}

function getCachedPreferenceSets() {
    const sets = new Set();
    for (const user of users.values()) {
        sets.add(JSON.stringify([...(user.preferences || [])].sort()));
    }
    return [...sets].map((s) => JSON.parse(s));
}

module.exports = {
    getUserByEmail,
    createUser,
    updatePreferences,
    saveArticles,
    getArticleById,
    markRead,
    markFavorite,
    getReadArticles,
    getFavoriteArticles,
    getCachedPreferenceSets,
};
