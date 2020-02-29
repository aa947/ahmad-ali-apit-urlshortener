'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
require('dotenv').config();
var sha1 = require('sha1');
var Urls = require('./models/urls');
//const { MongoClient } = require('mongodb');




var cors = require('cors');
const dns = require('dns');


var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.use('/public', express.static(process.cwd() + '/public'));

//db set up
const db = require("./db");
const dbName = "fcc";
const collectionName = "urls";

// << db init >>
db.initialize(dbName, collectionName, function(dbCollection) { // successCallback
  // get all items
  dbCollection.find().toArray(function(err, result) {
      if (err) throw err;
        console.log(`connected to ${collectionName} ... `);
  });



  app.get('/', function(req, res){
    res.sendFile(process.cwd() + '/views/index.html');
  });
  
  app.post('/api/existed-shorturl', (req, res)=>{
    let url = req.body.url.trim();
    dbCollection.findOne({'short_url': url }, (err, data)=>{
      if(err){ return console.log(err)};
      console.log(data);
      let redirect_url = data.original_url;
      res.redirect(redirect_url);

    });
  })
 

  app.get('/api/shorturl/:url', (req, res, next)=>{
    let url = req.params.url;
    console.log(url);
    if(url ==='new'){ return next(); }
    dbCollection.findOne({'short_url': url }, (err, data)=>{
      if(err){ return console.log(err)};
      //let redirect_doc = data[0];
      //console.log(redirect_doc);
      //let redirect_url = redirect_doc.short_url;
      console.log(data);
      let redirect_url = data.original_url;
      res.redirect(redirect_url);

    });
  });  

  
app.get('/api/all_urls', (req, res, next)=>{
  dbCollection.find().toArray((err, data)=>{
    if(err){ return next(err)};
    res.json({resp: data});
  })
});



app.post('/api/shorturl/new', function(req, res, next){
  console.log(req.body);
  let original_url = req.body.url;
  let new_original_url = original_url
  var url_regex = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;

  if( url_regex.test(new_original_url)){
    let  http_www_regex = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)/;
    var original = new_original_url.replace(http_www_regex, '');
    console.log(original);
    let etc_url_regex =/((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/;
    let alt_original = original.replace(etc_url_regex, '');

    const dns_options = {
      family: 4,
      hints: dns.ADDRCONFIG | dns.V4MAPPED,
    };

    dns.lookup(alt_original,dns_options, (err, address, family) => {
      console.log('address: %j family: IPv%s Err: %e', address, family, err);
      if (!address && !family) { return res.json({'error': 'Invailed Url'})  }
      else {
      console.log('here');
      let short = sha1(original);
      console.log(short);

      dbCollection.insertOne({original_url: original_url , short_url: short}, (err, url)=>{
        if(err){ return next(err); };
     
         dbCollection.findOne({'short_url': short}, (err, url)=>{
           res.json(url);
         })
         });
        }

       });


  } else {
    res.json({'error': 'Invailed Url'})
  }

  

   
});






 // last line of db connection 
}
//, function(err) {throw (err);}
);





  


app.listen(port, function () {
  console.log('Node.js listening ...', port);
});