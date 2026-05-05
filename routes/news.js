const express = require('express');
const authenticate = require('../middleware/auth');
const store = require('../data/store');
const { fetchNewsFor, searchNews } = require('../services/newsService');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
    try {
        const user = store.getUserByEmail(req.user.email);
        if (!user) return res.status(404).json({ error: 'User not found' });
        const news = await fetchNewsFor(user.preferences || []);
        return res.status(200).json({ news });
    } catch (err) {
        next(err);
    }
});

router.get('/read', (req, res) => {
    const articles = store.getReadArticles(req.user.email);
    if (articles === null) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json({ articles });
});

router.get('/favorites', (req, res) => {
    const articles = store.getFavoriteArticles(req.user.email);
    if (articles === null) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json({ articles });
});

router.get('/search/:keyword', async (req, res, next) => {
    try {
        const keyword = (req.params.keyword || '').trim();
        if (!keyword) return res.status(400).json({ error: 'Keyword required' });
        const news = await searchNews(keyword);
        return res.status(200).json({ news });
    } catch (err) {
        next(err);
    }
});

router.post('/:id/read', (req, res) => {
    const updated = store.markRead(req.user.email, req.params.id);
    if (!updated) return res.status(404).json({ error: 'Article not found' });
    return res.status(200).json({ message: 'Article marked as read', id: req.params.id });
});

router.post('/:id/favorite', (req, res) => {
    const updated = store.markFavorite(req.user.email, req.params.id);
    if (!updated) return res.status(404).json({ error: 'Article not found' });
    return res.status(200).json({ message: 'Article marked as favorite', id: req.params.id });
});

module.exports = router;
