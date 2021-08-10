require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const shortid = require('shortid');
var dns = require('dns');
var bodyParser = require('body-parser');
var validUrl = require('valid-url');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
// Basic Configuration
const dbUrl = "mongodb+srv://<username>:<password>@cluster0.wxlxk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
mongoose.connect(dbUrl, { useNewUrlParser: true }).then(() => { console.log('connected to the database') },
  err => { console.log(err) })
const { Schema } = mongoose;
const urlSchema = new Schema({
  original_url: { type: String, required: true },
  short_url: String,
});
const urlSch = mongoose.model("urlsStore", urlSchema);
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/shorturl/:short_url', async (req, res) => {
  let url = req.params.short_url;
  let already = await urlSch.findOne({ short_url: url }).exec();
  try {

    if (already) {
      res.redirect(already.original_url);
    }
    else {
      res.json({ error: 'invalid url' })
    }
  }
  catch (err) {
    if (err) {
      console.log(err);
      res.status(501).json({ error: 'invalid url' });
    }
  }
})
app.post('/api/shorturl', async (req, res) => {
    let url = req.body.url;

    if (!validUrl.isHttpsUri(url)) {
        res.json({ "error": 'invalid url' });
    }
    else {
        try {
            let findOne = await urlSch.findOne({ original_url: url });
            if (findOne) {
                res.json({ 'original_url': findOne.original_url, 'short_url': findOne.short_url });
            }
            else {
                var query = urlSch.find();
                query.count((err, count) => {
                    const findOne = new urlSch({
                        original_url: url,
                        short_url: count + 1,
                    });
                    findOne.save().then((findOne) => {
                       
                        res.json({ 'original_url': findOne.original_url, 'short_url': findOne.short_url })
                    })
                })

            }
        }
        catch (err) {
            if (err) {
                console.log(err);
                res.status(500).json('server error')
            }
        }

    }
});
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
