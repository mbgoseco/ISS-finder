'use strict';

const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const superagent = require('superagent');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));

app.set('view engine', 'ejs');

require('dotenv').config();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

// Error handler
function handleError(err, res) {
  console.error('ERROR', err);
  res.render('./pages/error', {error: 'Something went wrong! Please refresh your page.'});
}
