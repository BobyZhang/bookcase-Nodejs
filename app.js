var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var flow = require('nimble'); // sequence

var routes = require('./routes');
var users = require('./routes/user');

var app = express();

var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'bookcasedb'
});
db.connect();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

app.get('/', routes.index);
app.get('/users', users.list);
app.get('/auth', function (req, res) {
    res.write('ja');
    res.end();
});
// app.post('/auth/register', function (req, res) {
//     console.log(req.body.member_id);
//     res.write(req.body.member_id);
//     res.end();
// });
// login
app.post('/auth/login', function (req, res) {

    db.query(  
        'SELECT password FROM members where _id = "' + req.body.member_id + '"',  
        function (err, results, fields) {  
            if (err) {  
                throw err;
                var error = {
                    "errcode": 1,
                    "errmsg": "login_fail"
                };
                res.write(JSON.stringify(error));
                res.end();
            }  
            
            console.log(results);
            if(results) {
                if (results[0].password == req.body.password) {
                    var success = {
                        "errcode": 0
                    };
                    console.log(JSON.stringify(success));
                    res.write(JSON.stringify(success));
                    res.end();
                }
                else {
                    var notFound = {
                        "errcode": 1,
                        "errmsg": "not_found"
                    };
                    console.log(JSON.stringify(notFound));
                    res.write(JSON.stringify(notFound));
                    res.end();
                }
            }    
            //db.end();  
        }  
    ); 
});
// donate
app.post('/book/edit', function (req, res) {
    var book = req.body;
    db.query(
        'insert into books(isbn, title, alt, author, publisher, image, pub_date)' +
        'values("' + book.isbn + '","' + book.title + '","' + book.alt + '","' + book.author + 
        '","' + book.publisher + '","' +   book.image + '","' + book.pub_date + '")',
        function (err, results) {
            if (err) {  
                throw err;
                var error = {
                    "errcode": 1,
                    "errmsg": ""
                };
                res.write(JSON.stringify(error));
                res.end();
            }
            db.query(
                'insert into own(isbn, _id, borrowed) values("' + book.isbn + '","' + book.donor + '", 0);',
                function (err2, results2) {
                    if (err) {  
                        throw err;
                        var error = {
                            "errcode": 1,
                            "errmsg": ""
                        };
                        res.write(JSON.stringify(error));
                        res.end();
                    }
                    else {
                        var success = {
                            "errcode": 0,
                            "errmsg": ""
                        };
                        res.write(JSON.stringify(success));
                        res.end();
                    }
                }
            );
        }
    );
});
// add book to wunderlist
app.post('/wunderlist/edit', function (req, res) {
    console.log("haha0");
    // judge whether in wunderlist     
    db.query(
        'select isbn from wunderlist where isbn = "' + req.body.isbn + '"',
        function (err, results) {
            if (err) {  
                throw err;
                var error = {
                    "errcode": 1,
                    "errmsg": "SQL insert failed"
                 };
                 res.write(JSON.stringify(error));
                 res.end();
                 return;
             }
             console.log("haha1");
             if (results.length > 0) {
                 var exitInWun = {
                     "errcode": 1,
                     "errmsg": "book_exist"
                 };
                 res.write(JSON.stringify(exitInWun));
                 res.end();
                 return;
             }
             // judge whether own this book
             db.query(
                'select isbn from own where isbn = "' + req.body.isbn + '"',
                function (err, results) {
                    if (err) {  
                        throw err;
                        var error = {
                            "errcode": 1,
                            "errmsg": "SQL insert failed"
                         };
                         res.write(JSON.stringify(error));
                         res.end();
                         return;
                     }
                     console.log("haha2");
                     if (results.length > 0) {
                         var exitInBook = {
                             "errcode": 1,
                             "errmsg": "book_got"
                         };
                         res.write(JSON.stringify(exitInBook));
                         res.end();
                         return;
                     }
                     // store to database
                    var book = req.body;
                     db.query(
                        'select isbn from books where isbn = "' + book.isbn + '"',
                        function (err, results1) {
                            if (err) {  
                                throw err;
                                var error = {
                                    "errcode": 1,
                                    "errmsg": "SQL insert failed"
                                };
                                res.write(JSON.stringify(error));
                                res.end();
                                return;
                            }
                            console.log("haha3");
                            // if don't have this book, insert into BOOKS
                            if (results1.length <= 0) {
                                db.query(
                                    'insert into books(isbn, title, alt, author, publisher, image, pub_date)' +
                                    'values("' + book.isbn + '","' + book.title + '","' + book.alt + '","' + book.author + 
                                    '","' + book.publisher + '","' +   book.image + '","' + book.pub_date + '")',
                                    function (err, results) {
                                        if (err) {  
                                            throw err;
                                            var error = {
                                                "errcode": 1,
                                                "errmsg": "SQL insert failed"
                                            };
                                            res.write(JSON.stringify(error));
                                            res.end();
                                            return;
                                        }
                                        // insert into wunderlist
                                        insertIntoWun(book, res);
                                        return;
                                    }
                                );
                            }
                            else {
                                // insert into wunderlist
                                insertIntoWun(book, res);
                                return;
                            }
                        }
                        
                    );
                }
            );
        }
    );
    
    // store to database
    //var book = req.body;
    // first judge whether in books
    /*db.query(
        'select isbn from books where isbn = "' + book.isbn + '"',
        function (err, results1) {
            if (err) {  
                throw err;
                var error = {
                    "errcode": 1,
                    "errmsg": "SQL insert failed"
                };
                res.write(JSON.stringify(error));
                res.end();
            }
            // if don't have this book, insert into BOOKS
            if (results1.length <= 0) {
                db.query(
                    'insert into books(isbn, title, alt, author, publisher, image, pub_date)' +
                    'values("' + book.isbn + '","' + book.title + '","' + book.alt + '","' + book.author + 
                    '","' + book.publisher + '","' +   book.image + '","' + book.pub_date + '")',
                    function (err, results) {
                        if (err) {  
                            throw err;
                            var error = {
                                "errcode": 1,
                                "errmsg": "SQL insert failed"
                            };
                            res.write(JSON.stringify(error));
                            res.end();
                        }
                    }
                );
            }
        }
        
    );
    // insert into wunderlist
    db.query(
        'insert into wunderlist(isbn, _id) values("' + book.isbn + '","' + book.voter + '")',
        function (err, results) {
            if (err) {  
                throw err;
                var error = {
                    "errcode": 1,
                    "errmsg": "SQL insert failed"
                };
                res.write(JSON.stringify(error));
                res.end();
            }
            else {
                var success = {
                    "errcode": 0,
                    "errmsg": ""
                };
                res.write(JSON.stringify(success));
                res.end();
            }
        }
    );*/
});

// for test
app.get('/wunderlist/get', function (req, res) {
    var page = req.query.page;
    var sort = req.query.sort;
    console.log(page);
    console.log(sort);
})

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.render('error', {
        message: err.message,
        error: {}
    });
});

function insertIntoWun(data, res) {
    var book = data;
    db.query(
        'insert into wunderlist(isbn, _id) values("' + book.isbn + '","' + book.voter + '")',
        function (err, results) {
            if (err) {  
                throw err;
                var error = {
                    "errcode": 1,
                    "errmsg": "SQL insert failed"
                };
                res.write(JSON.stringify(error));
                res.end();
            }
            else {
                var success = {
                "errcode": 0,
                "errmsg": ""
                };
                res.write(JSON.stringify(success));
                res.end();
            }
        }
    );
}

module.exports = app;
