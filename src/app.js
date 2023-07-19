const express = require('express');
require('./db/mongoose');
const userRouter = require('./routes/user');
const taskRouter = require('./routes/task');

const app = express();

app.use(express.json());
//parse the incoming json to an object
// Returns middleware that only parses json
// and only looks at requests where
// the Content-Type header matches
// the type option.
app.use(userRouter);
app.use(taskRouter);

module.exports = app;
