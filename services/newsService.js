const crypto = require('crypto');
const axios = require('axios');
const { newsApiKey, newsCacheTtlMs } = require('../config');
const store = require('../data/store');

const TOP_HEADLINES_URL = 'https://newsapi.org/v2/top-headlines';
const EVERYTHING_URL = 'https://newsapi.org/v2/everything';
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

const cache = new Map();
let refreshTimer = null;

function articleId(article) {
    const seed = article.url || `${article.title}|${article.publishedAt}`;
    return crypto.createHash('md5').update(seed).digest('hex');
}

function withIds(articles) {
    return articles.map((a) => ({ ...a, id: articleId(a) }));
}

function cacheKey(preferences) {
    return [...(preferences || [])].sort().join('|') || '__all__';
}

async function callNewsApi(url, params) {
    if (!newsApiKey) return [];
    try {
        const response = await axios.get(url, {
            params: { ...params, apiKey: newsApiKey },
            timeout: 5000,
        });
        return (response.data && response.data.articles) || [];
    } catch (err) {
        console.error('News API error:', err.message);
        return [];
    }
}

async function fetchNewsFor(preferences) {
    const key = cacheKey(preferences);
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && now - cached.timestamp < newsCacheTtlMs) {
        return cached.articles;
    }

    const params = { language: 'en', pageSize: 20 };
    if (preferences && preferences.length) {
        params.q = preferences.join(' OR ');
    } else {
        params.country = 'us';
    }

    const raw = await callNewsApi(TOP_HEADLINES_URL, params);
    const articles = withIds(raw);
    store.saveArticles(articles);
    cache.set(key, { timestamp: now, articles });
    return articles;
}

async function searchNews(keyword) {
    if (!keyword) return [];
    const raw = await callNewsApi(EVERYTHING_URL, {
        q: keyword,
        language: 'en',
        pageSize: 20,
    });
    const articles = withIds(raw);
    store.saveArticles(articles);
    return articles;
}

async function refreshAllCachedSets() {
    const sets = store.getCachedPreferenceSets();
    await Promise.all(
        sets.map(async (prefs) => {
            const key = cacheKey(prefs);
            cache.delete(key);
            try {
                await fetchNewsFor(prefs);
            } catch (err) {
                console.error('Background refresh error for', key, err.message);
            }
        })
    );
}

function startBackgroundRefresh(intervalMs = REFRESH_INTERVAL_MS) {
    if (refreshTimer) return;
    refreshTimer = setInterval(() => {
        refreshAllCachedSets().catch((err) => console.error('Refresh tick failed:', err));
    }, intervalMs);
    if (refreshTimer.unref) refreshTimer.unref();
}

function stopBackgroundRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}

module.exports = {
    fetchNewsFor,
    searchNews,
    startBackgroundRefresh,
    stopBackgroundRefresh,
    refreshAllCachedSets,
};
