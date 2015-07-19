var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysql = require('mysql'); // add 'mysql' package
var flow = require('nimble'); // sequence
var async = require('async');

var routes = require('./routes');
var users = require('./routes/user');

var app = express();

// create a 'mysql' connection
var db = mysql.createConnection({
    host: 'localhost',        // host address
    user: 'root',             // which user
    database: 'bookcasedb'    // which database
});

// connect
db.connect();

// // operating database
// db.query(
//     // SQL statement
//     'SELECT * FROM table',
//     // callback function
//     function (err, result) {
//     // err: if something wrong return error information
//     // result: if SQL statement execute succcessfully return result
//     
//     // do something
//     }
// );

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
  
            if (results.length > 0 && results[0].password == req.body.password) {
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
             
            //db.end();  
        }  
    ); 
});
// donate
app.post('/book/edit', function (req, res) {
    var book = req.body;
    // insert a new book to BOOKS
    db.query(
        // SQL statement
        'insert into books(isbn, title, alt, author, publisher, image, pub_date, donor) values(?,?,?,?,?,?,?,?)',
        [book.isbn,  book.title, book.alt, book.author, book.publisher, book.image, book.pub_date, book.donor],
        // callback function
        function (err, results) {
            // if something wrong, response error imformation
            if (err) {  
                throw err;
                var error = {
                    "errcode": 1,
                    "errmsg": "Something wrong"
                };
                res.write(JSON.stringify(error));
                res.end();
            }
            // if insert successfully, response successful imformation
            else {
                var success = {
                    "errcode": 0,
                    "errmsg": ""
                };
                // response data
                res.write(JSON.stringify(success));
                res.end();
            }
        }
    );
});
// add book to wunderlist
app.post('/wunderlist/edit', function (req, res) {
    
    // if the send data has problem
    if (req.body.isbn == null)
    {
        console.log("isbn is null");
        var error = {
            "errcode": 1,
            "errmsg": "SQL insert failed"
         };
         res.write(JSON.stringify(error));
         res.end();
         return;
    }
    // judge whether in wunderlist 
    
    async.series([
        function (callback) {
            console.log('1');
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
                     if (results.length > 0) {
                         var exitInWun = {
                             "errcode": 1,
                             "errmsg": "book_exist"
                         };
                         res.write(JSON.stringify(exitInWun));
                         res.end();
                         return;
                     }
                     callback(null, 'one');
                }
            );
        },
        function (callback) {
            console.log('2');
            db.query(
                'select isbn from books where isbn = "' + req.body.isbn + '"',
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
                     if (results.length > 0) {
                         var exitInBook = {
                             "errcode": 1,
                             "errmsg": "book_got"
                         };
                         res.write(JSON.stringify(exitInBook));
                         res.end();
                         return;
                     }
                     callback(null, 'two');
                }
            );
        },
        function (callback) {
            var book = req.body;
            console.log('3');
            db.query(
                'insert into wunderlist(isbn, title, alt, author, publisher, image, pub_date, created_at)' +
                'values(?,?,?,?,?,?,?,?)',
                [book.isbn,  book.title, book.alt, book.author, book.publisher, book.image, book.pub_date, getNowFormatDate()],
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
                    db.query(
                        'insert into vote(isbn, member_id) values(?, ?)',
                        [book.isbn, book.voter],
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
                            callback(null, 'three');
                        }
                    );
                }
            );
        }
    ]);
});

// get wunderlist
app.get('/wunderlist/get', function (req, res) {
    var page = req.query.page;
    var sort = req.query.sort;
    var maxNumber = req.query.maxNumber;
    
    db.query(
        'select * from wunderlist',
        function (err, books) {
            if (err) {
                throw err;
                var error = {
                    "errcode": 1,
                    "errmsg": "Something wrong"
                };
                res.write(JSON.stringify(error));
                res.end();
            }

            async.eachSeries(books, function (book, callback) {
                db.query(
                    'select fullname, m._id from wunderlist w, members m , vote v where v.isbn = w.isbn and v.member_id = m._id and ' +
                    'w.isbn = "' + book.isbn + '"',
                    function (err, voters) {
                        if (err) {
                            throw err;
                            var error = {
                                "errcode": 1,
                                "errmsg": "Something wrong"
                            };
                            res.write(JSON.stringify(error));
                            res.end();
                        }
                        
                        // add donor.cout
                        book.voter = voters;
                        book.voteCount = voters.length;
                        // callback
                        callback();
                    }
                );
            }, function () {
                var resData = {};
                resData.pages = Math.ceil(books.length / maxNumber);
                resData.page = page;
                resData.books = books;
                
                // sort
                if (sort == 'updated_at') {
                    resData.books.sort(compareDes('created_at'));
                }
                else if (sort == 'vote_count') {
                    resData.books.sort(compareDes('voteCount'));
                }
                else {
                    resData = {
                        "errcode": 1,
                        "errmsg": "no_sort"
                    };
                }
                
                // paging
                var startNumber = (page-1) * maxNumber < books.length ? (page-1) * maxNumber : books.length;
                var endNumber = page * maxNumber < books.length ? page * maxNumber : books.length;
                
                resData.books = resData.books.slice(startNumber, endNumber);
                
                res.write(JSON.stringify(resData));
                res.end();
            });
        }
    );
});

// wunderlist vote
app.get('/wunderlist/vote', function (req, res) {
    var isbn = req.query.isbn;
    var voter = req.query.voter;
    
    async.series([
        // make sure whether hava this book in wunderlist
        function (callback) {
            db.query(
                'select * from wunderlist where isbn = "' + isbn + '"',
                function (err, result) {
                    console.log('test');
                    if (err) {
                        console.log(typeof result);
                        var error = {
                            "errcode": 1,
                            "errmsg": "Something wrong"
                        };
                        res.write(JSON.stringify(error));
                        res.end();
                        return;
                    }
                    // err! Don't have this book
                    if (result.length == 0) {
                        var no_isbn = {
                            "errcode": 1,
                            "errmsg": "no_isbn"
                        };
                        res.write(JSON.stringify(no_isbn));
                        res.end();
                        return;
                    }
                    callback(null, 'one');
                }
            );
        },
        // make sure whether this user had voted before
        function (callback) {
            db.query(
                'select * from vote where isbn = "' + isbn + '" and member_id = "' + voter + '"',
                function (err, result) {
                    if (err) {
                        var error = {
                            "errcode": 1,
                            "errmsg": "Something wrong"
                        };
                        res.write(JSON.stringify(error));
                        res.end();
                        return;
                    }
                    // err! This user had voted this book
                    if (result.length != 0) {
                        var already_vote = {
                            "errcode": 1,
                            "errmsg": "already_vote"
                        };
                        res.write(JSON.stringify(already_vote));
                        res.end();
                        return;
                    }
                    callback(null, 'two');
                }
            );
        },
        // insert this vote into table(VOTE)
        function (callback) {
            db.query(
                'insert into vote(isbn, member_id) values(?,?)',
                [isbn, voter],
                function (err, result) {
                    if (err) {
                        var error = {
                            "errcode": 1,
                            "errmsg": "Something wrong"
                        };
                        res.write(JSON.stringify(error));
                        res.end();
                        return;
                    }
                    // vote successfully
                    else {
                        var success = {
                            "errcode": 0
                        };
                        res.write(JSON.stringify(success));
                        res.end();
                        return;
                    }
                    callback(null, 'three');
                }
            );
        },
    ]);
});

// get books list
app.get('/book/get', function (req, res) {
    var page = req.query.page;
    var maxNumber = req.query.maxNumber;
    
    db.query(
        'select * from books',
        function (err, books) {
            if (err) {
                throw err;
                var error = {
                    "errcode": 1,
                    "errmsg": "Something wrong"
                };
                res.write(JSON.stringify(error));
                res.end();
                return;
            }
            
            // 
            var resData = {};
            resData.pages = Math.ceil(books.length / maxNumber);
            resData.page = page;
            resData.books = books;
            
            // sort, the book not be borrowed in the front
            resData.books.sort(compareAsc('borrowed'));
            
            // paging
            var startNumber = (page-1) * maxNumber < books.length ? (page-1) * maxNumber : books.length;
            var endNumber = page * maxNumber < books.length ? page * maxNumber : books.length;
            
            resData.books = resData.books.slice(startNumber, endNumber);
            
            res.write(JSON.stringify(resData));
            res.end();
            return;
        }
    );  
});

// book search
app.get('/book/search', function (req, res) {
    var title = req.query.title;
    console.log(title);
    
    db.query(
        'select * from books where title like "%' + title + '%"',
        function (err, result) {
            if (err) {
                throw err;
                var error = {
                    "errcode": 1,
                    "errmsg": "Something wrong"
                };
                res.write(JSON.stringify(error));
                res.end();
                return;
            }
            // else return the data
            else {
                // sort
                result.sort(compareAsc('borrowed'));
                res.write(JSON.stringify(result));
                res.end();
            }
        }
    );
    return;
});

// borrow a book
app.get('/book/borrow', function (req, res) {
    var book_id = req.query.book_id;
    var member_id = req.query.member_id;
    
    async.series([
        // test the validity
        // fisrt the book
        function (callback) {
            db.query(
                'select * from books where id = "' + book_id +'"',
                // [book_id],
                function (err, book) {
                    if (err) {
                        throw err;
                        var error = {
                            "errcode": 1,
                            "errmsg": "Something wrong"
                        };
                        res.write(JSON.stringify(error));
                        res.end();
                        return;
                    }
                    // this book not exist
                    if (book.length == 0) {
                        var notExist = {
                            "errcode": 1,
                            "errmsg": "book_not_exist"
                        };
                        res.write(JSON.stringify(notExist));
                        res.end();
                        return;
                    }
                    // this book has been borrowed
                    else if (book[0].borrowed == true) {
                        var beBorrowed = {
                            "errcode": 1,
                            "errmsg": "has_been_borrowed"
                        };
                        res.write(JSON.stringify(beBorrowed));
                        res.end();
                        return;
                    }
                    callback(null);
                }
            );
        },
        //second the user
        function (callback) {
            db.query(
                'select * from members where _id = "' + member_id +'"',
                // [book_id],
                function (err, book) {
                    if (err) {
                        throw err;
                        var error = {
                            "errcode": 1,
                            "errmsg": "Something wrong"
                        };
                        res.write(JSON.stringify(error));
                        res.end();
                        return;
                    }
                    // this book not exist
                    if (book.length == 0) {
                        var notExist = {
                            "errcode": 1,
                            "errmsg": "no_this_user"
                        };
                        res.write(JSON.stringify(notExist));
                        res.end();
                        return;
                    }
                    callback(null);
                }
            );
        },
        // update 
        function (callback) {
            db.query(
                'update books set borrowed = 1 where id = "' + book_id +'"',
                //[book_id],
                function (err, result) {
                    if (err) {
                        throw err;
                        var error = {
                            "errcode": 1,
                            "errmsg": "Something wrong"
                        };
                        res.write(JSON.stringify(error));
                        res.end();
                        return;
                    }
                    // insert into borrowed
                    db.query(
                        'insert into borrowed(book_id, member_id, borrow_time) values(?,?,?)',
                        [book_id, member_id, getNowFormatDate()],
                        function (err, result2) {
                            if (err) {
                                throw err;
                                var error = {
                                    "errcode": 1,
                                    "errmsg": "Something wrong"
                                };
                                res.write(JSON.stringify(error));
                                res.end();
                                return;
                            }
                            var success = {
                                "errcode": 0
                            };
                            res.write(JSON.stringify(success));
                            res.end();
                            callback(null);
                        }
                    );
                }
            );
        }
    ]);
    return;
});

// return a book
app.get('/book/return', function (req, res) {
    var member_id = req.query.member_id;
    var book_id = req.query.book_id;
    
    async.series([
        // test the validity
        // fisrt the book
        function (callback) {
            db.query(
                'select * from books where id = "' + book_id +'"',
                // [book_id],
                function (err, book) {
                    if (err) {
                        throw err;
                        var error = {
                            "errcode": 1,
                            "errmsg": "Something wrong"
                        };
                        res.write(JSON.stringify(error));
                        res.end();
                        return;
                    }
                    // this book not exist
                    if (book.length == 0) {
                        var notExist = {
                            "errcode": 1,
                            "errmsg": "book_not_exist"
                        };
                        res.write(JSON.stringify(notExist));
                        res.end();
                        return;
                    }
                    // this book has been borrowed
                    else if (book[0].borrowed == false) {
                        var beBorrowed = {
                            "errcode": 1,
                            "errmsg": "not_be_borrowed"
                        };
                        res.write(JSON.stringify(beBorrowed));
                        res.end();
                        return;
                    }
                    callback(null);
                }
            );
        },
        //second the user
        function (callback) {
            db.query(
                'select * from members where _id = "' + member_id +'"',
                // [book_id],
                function (err, book) {
                    if (err) {
                        throw err;
                        var error = {
                            "errcode": 1,
                            "errmsg": "Something wrong"
                        };
                        res.write(JSON.stringify(error));
                        res.end();
                        return;
                    }
                    // this book not exist
                    if (book.length == 0) {
                        var notExist = {
                            "errcode": 1,
                            "errmsg": "no_this_user"
                        };
                        res.write(JSON.stringify(notExist));
                        res.end();
                        return;
                    }
                    callback(null);
                }
            );
        },
        // update 
        function (callback) {
            
            // insert into borrowed
            db.query(
                'delete from borrowed where member_id = ? and book_id = ?',
                [member_id,book_id],
                function (err, result2) {
                    if (err) {
                        throw err;
                        var error = {
                            "errcode": 1,
                            "errmsg": "Something wrong"
                        };
                        res.write(JSON.stringify(error));
                        res.end();
                        return;
                    }
                    
                    // prepare the data will be sent
                    var resData = {};
                    if (result2.affectedRows == 0) {
                        resData = {
                            "errcode": 1,
                            "errmsg": "This user not borrow this book"
                        };
                        res.write(JSON.stringify(resData));
                        res.end();
                        return;
                    }
                    else if (result2.affectedRows == 1) {
                        
                        db.query(
                            'update books set borrowed = 0 where id = "' + book_id +'"',
                            //[book_id],
                            function (err, result) {
                                if (err) {
                                    throw err;
                                    var error = {
                                        "errcode": 1,
                                        "errmsg": "Something wrong"
                                    };
                                    res.write(JSON.stringify(error));
                                    res.end();
                                    return;
                                }
                                
                                
                                //send
                                resData = {
                                    "errcode": 0
                                };
                                res.write(JSON.stringify(resData));
                                res.end();  
                            }
                        );
                    }
                    
                    
                    callback(null);
                }
            );
        }
    ]);
    return;
});

// get personal borrow book
app.get('/auth/getBorrowedBook', function (req, res) {
    var member_id = req.query.member_id;
    
    async.series([
        // test vality, whether exist this user
        function (callback) {
            db.query(
                'select * from members where _id = "' + member_id +'"',
                function (err, book) {
                    if (err) {
                        throw err;
                        var error = {
                            "errcode": 1,
                            "errmsg": "Something wrong"
                        };
                        res.write(JSON.stringify(error));
                        res.end();
                        return;
                    }
                    // this use not exist
                    if (book.length == 0) {
                        var notExist = {
                            "errcode": 1,
                            "errmsg": "no_this_user"
                        };
                        res.write(JSON.stringify(notExist));
                        res.end();
                        return;
                    }
                    callback(null);
                }
            );
        },
        function (callback) {
            db.query(
                'select * from borrowedBooks where member_id = ?',
                [member_id],
                function (err, result) {
                    if (err) {
                        throw err;
                        var error = {
                            "errcode": 1,
                            "errmsg": "Something wrong"
                        };
                        res.write(JSON.stringify(error));
                        res.end();
                        return;
                    }
                    
                    // if no err
                    res.write(JSON.stringify(result));
                    res.end();
                    
                    callback(null);
                }
            );
        }
    ]);
});
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
    
}

// get Time as format “yyyy-MM-dd HH:MM:SS”
function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
            + " " + date.getHours() + seperator2 + date.getMinutes()
            + seperator2 + date.getSeconds();
    return currentdate;
}

function compareDes(propertyName) { 
    return function (object1, object2) { 
        var value1 = object1[propertyName]; 
        var value2 = object2[propertyName]; 
        if (value2 < value1) { 
            return -1; 
        } 
        else if (value2 > value1) { 
            return 1; 
        } 
        else { 
            return 0; 
        } 
    } 
} 
function compareAsc(propertyName) { 
    return function (object1, object2) { 
        var value1 = object1[propertyName]; 
        var value2 = object2[propertyName]; 
        if (value2 > value1) { 
            return -1; 
        } 
        else if (value2 < value1) { 
            return 1; 
        } 
        else { 
            return 0; 
        } 
    } 
} 

module.exports = app;
