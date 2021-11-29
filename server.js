var express = require('express');
var app = express();
const session = require('cookie-session');
const bodyParser = require('body-parser');
const app = express();
const ObjectID = require('mongodb').ObjectID;
const fs = require('fs');
const formidable = require('experss-formidable');
const assert = require('assert');
const http = require('http');
const url = require('url');
const mongourl = 'mongodb+srv://Admin:Admin@cluster.yhbdv.mongodb.net/inventory?retryWrites=true&w=majority';
const mongoose = require('mongoose');
const inventorySchema = mongoose.Schema({ 
    inventory_ID: String,
    mobile: String
});

app.set('view engine','ejs');

const users = new Array(
	{name: 'demo', password: ''},
	{name: 'Admin', password: 'admin'}
);

app.set('view engine','ejs');

app.use(session({
  name: 'loginSession',
}));

// support parsing of application/json type post data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/login', (req,res) => {
	res.status(200).render('login',{});
});

app.post('/login', (req,res) => {
	users.forEach((user) => {
		if (user.name == req.body.name && user.password == req.body.password) {
			// correct user name + password
			// store the following name/value pairs in cookie session
			req.session.authenticated = true;        // 'authenticated': true
			req.session.username = req.body.name;	 // 'username': req.body.name		
		}
	});
});

app.get('/logout', (req,res) => {
	req.session = null;   // clear cookie-session
	res.redirect('/');
});

app.listen(process.env.PORT || 8099);

const handle_Find = (res, criteria) => {
    mongoose.connect(mongourl, {useMongoClient: true});
    let db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        const Inventory = mongoose.model('inventory',inventorySchema);
        Inventory.find(criteria, (err,results) => {
            if (err) return console.error(err);
            res.writeHead(200, {"content-type":"text/html"});
            res.write(`<html><body><H2>Inventories (${results.length})</H2><ul>`);
            for (var doc of results) {
                res.write(`<li>Inventory ID: <a href="/details?_id=${doc._id}">${doc.inventoryid}</a></li>`);
            }
            res.end('</ul></body></html>');
            console.log("Closed DB connection");
            db.close();
        })
    })
}

const handle_Details = (res, criteria) => {
    mongoose.connect(mongourl, {useMongoClient: true});

    let db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        /* use Document ID for query */
        let DOCID = {};
        DOCID['_id'] = ObjectID(criteria._id)
        const Inventory = mongoose.model('inventory',inventorySchema);
        Inventory.findOne(criteria, (err,results) => {
            if (err) return console.error(err);
            res.writeHead(200, {"content-type":"text/html"});
            res.write('<html><body><ul>');
            //console.log(docs);
            res.write(`<H2>Inventory Details</H2><hr>`)
            res.write(`<p>Inventory ID: <b>${results.inventoryid}</b></p>`);
            res.write(`<p>Name: <b>${results.name}</b></p>`)
	    res.write(`<p>TypeName: <b>${results.type}</b></p>`)
	    res.write(`<p>Quantity: <b>${results.quantity}</b></p>`)
            res.write(`<a href="/edit?_id=${results._id}">edit</a><br><br>`)
            res.write(`<a href="/find">back<a>`);
            res.end('</body></html>');
            db.close();
        });
    });
}

const handle_Edit = (res, criteria) => {
    mongoose.connect(mongourl, {useMongoClient: true});
    
    let db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        /* use Document ID for query */
        let DOCID = {};
        DOCID['_id'] = ObjectID(criteria._id)
        const Inventory = mongoose.model('booking',bookingSchema);
        Inventory.findOne(criteria, (err,results) => {
            if (err) return console.error(err);
            res.writeHead(200, {"content-type":"text/html"});
            res.write('<html><body>');
            res.write('<form action="/update" method=GET>');
            res.write(`Inventory ID: <input name="bookingid" value=${results.bookingid}><br>`);
            res.write(`Mobile: <input name="mobile" value=${results.mobile} /><br>`);
            res.write(`<input type="hidden" name="_id" value=${results._id}>`)
            res.write(`<input type="submit" value="update">`);
            res.end('</form></body></html>');
            db.close();
        });
    });
}

const handle_Update = (res, criteria) => {
    mongoose.connect(mongourl, {useMongoClient: true});
    
    let db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        /* use Document ID for query */
        let DOCID = {};
        DOCID['_id'] = ObjectID(criteria._id)
        const Inventory = mongoose.model('inventory',inventorySchema);
        Inventory.findOne(DOCID, (err,results) => {
            //console.log(results);
            results.bookingid = criteria.bookingid;
            results.mobile = criteria.mobile;
            results.save(err => {
                res.writeHead(200, {"content-type":"text/html"});
                res.write(`<html><body><p>Updated document(s)<p><br>`);
                res.end('<a href="/">back</a></body></html>');
                db.close();
            })
        })
    })
}

const server = http.createServer((req,res) => {
    var parsedURL = url.parse(req.url, true);
 
    switch(parsedURL.pathname) {
        case '/':
        case '/find':
            handle_Find(res, parsedURL.query);
            break;
        case '/details':
            handle_Details(res, parsedURL.query);
            break;
        case '/edit':
            handle_Edit(res, parsedURL.query);
            break;
        case '/update':
            handle_Update(res, parsedURL.query);
            break;
        default:
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end(`${parsedURL.pathname} - Unknown request!`);
    }
})
 
server.listen(process.env.PORT || 8099);
