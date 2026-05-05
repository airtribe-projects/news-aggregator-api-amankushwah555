require('dotenv').config();

const express = require('express');
const usersRouter = require('./routes/users');
const newsRouter = require('./routes/news');
const { startBackgroundRefresh } = require('./services/newsService');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/users', usersRouter);
app.use('/news', newsRouter);

app.post('/register', (req, res, next) => {
    req.url = '/signup';
    usersRouter.handle(req, res, next);
});
app.post('/login', (req, res, next) => {
    req.url = '/login';
    usersRouter.handle(req, res, next);
});
app.get('/preferences', (req, res, next) => {
    req.url = '/preferences';
    usersRouter.handle(req, res, next);
});
app.put('/preferences', (req, res, next) => {
    req.url = '/preferences';
    usersRouter.handle(req, res, next);
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
    app.listen(port, (err) => {
        if (err) {
            return console.log('Something bad happened', err);
        }
        console.log(`Server is listening on ${port}`);
        startBackgroundRefresh();
    });
}

module.exports = app;
