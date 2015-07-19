var currPage = 1; // use to mark curr page
var allPages = 1; // use to mark total count of pages

function BorrowBook() {
    var borrowed;
    var book_id;
    Book.call(this); // for interitance
}
inheritPrototype(BorrowBook, Book);

BorrowBook.prototype.showList = function () {
    // basic inf show
    this.show();
    var objBook = this;

    // create an add book botton
    var button = $('<button> 借 阅 </button>')
    button.addClass('submit-borrow');

    
    
    // if this book has been borrowed, change the css
    if (this.bookInf.borrowed == true) {
        button.css({
            "cursor": "not-allowed",
            "background-color": "#fff",
            "border": "1px solid #0086B5",
            "color": "#0086B5"
        });
        //button.attr("value") = "已被借阅";
        button.text("已借出");
        button.click(function () {
            return;
        });
    } else {
        // add Listen to this button
        button.click(function () {
            submitBorrow(objBook);
        });
    }
    
    

    // append this node
    button.insertAfter(this.node.children(':last'));
}

// start
//
// choose which part of js code execute
//
var pageTitle = document.title;

switch (pageTitle) {
    case 'Continue-borrow':
        handleBorrowPage();
        break;
    //case 'Continue-add-wunderlist':
    //    handleWunderlistAdd();
    //    break;
}

function handleBorrowPage() {
    // change the style of nav
    $('#public-nav .borrow').css('color', '#0084B5');
    $('#public-nav .donate').css('color', '#767779');
    $('#public-nav .wunderlist').css('color', '#767779');
    

    // listen to some operator like next, prev
    listenTurnOpetation(); 
    
    // listen to search book box
    var searchBox = $('.search-box');

    searchBox.focus(function () {
        // lister to Enter when focus on search-box 
        $(this).keydown(function (event) {
            var e = event || window.event;

            // if not Enter key, return
            if (e && e.keyCode != 13) return;
            // get book from douban
            getSearchBook(searchBox.val());

        });
    });
    
}

//
// listen to smoe operation, just like next page
//
function listenTurnOpetation() {

    // clean page
    cleanAllChilden($('#borrow-list')); 
    // get the first page of wunderlist
    getBorrowlist(1);
    // uppdate
    updatePages();

    // next page
    var nextPage = $('#borrow-content .next-page');
    nextPage.click(function () {
        if (currPage == allPages) {
            alert('This is the last page!');
            return;
        }
        cleanAllChilden($('#borrow-list')); // clean page
        getBorrowlist(++currPage);
        updatePages();
    });

    // prev page
    var prePage = $('#borrow-content .pre-page');
    prePage.click(function () {
        if (currPage == 1) {
            alert('This is the first page!');
            return;
        }
        cleanAllChilden($('#borrow-list')); // clean page
        getBorrowlist(--currPage);
        updatePages();
    })

    // first page
    var firstPage = $('#borrow-content .first-page');
    firstPage.click(function () {
        cleanAllChilden($('#borrow-list')); // clean page
        currPage = 1;
        getBorrowlist(currPage);
        updatePages();
    });

    // last page
    var lastPage = $('#borrow-content .last-page');
    lastPage.click(function () {
        cleanAllChilden($('#borrow-list')); // clean page
        currPage = allPages;
        getBorrowlist(currPage);
        updatePages();
    });
}

//
// get books form wunderlist
//
function getBorrowlist(turnedPage) {
    // send wunderlist require
    var url = '/book/get?' + 'page=' + turnedPage + '&maxNumber=' + 8;

    $.ajax({
        url: url,
        type: 'get',
        async: false
    })
    .done(function (resData) {
        // TODO: why
        var res = JSON.parse(resData);
        showList(res);
    });
}

function getSearchBook(str) {
    console.log(str.length);
    // if no input return
    if (str.length == 0) return;
    
    // change style 
    $('.tips').css('display', 'block');
    $('.tips').html('正在搜索...');

    var url = '/book/search?title=' + str;
    
    $.ajax({
        url: url,
        type: 'get',
        async: true
    })
    .done(function (resData) {
        var res = JSON.parse(resData);
        
        if (res.errcode == 1) {
            $('.tips').html('发现错误，请稍后再试！');
            console.log(res.errmsg);
        } else {
            var s = '总共搜索到 ' + res.length + ' 本相关书籍';
            $('.tips').html(s);
            
            // hidden the page-turning
            $('.page-turning-block').css('display', 'none');
            cleanAllChilden($('#borrow-list'));
            
            showList(res);
        }
    })
}

//
// update the count of curr page and total page
//
function updatePages() {
    $('#borrow-content .curr').html(currPage);
    $('#borrow-content .total').html(allPages);
}

//
// submit a borrow request
//
function submitBorrow(objBook) {
    
    var book_id = objBook.bookInf.book_id;
    var member_id = CookieUtil.get('identify');
    
    var url = '/book/borrow?book_id=' + book_id + '&member_id=' + member_id;
    
    $.ajax({
        url: url,
        type: 'get',
        async: true
    })
    .done(function (resData) {
        var res = JSON.parse(resData);
        
        // if something wring
        if (res.errcode && res.errcode == 1) {
            alert(res.errmsg);
        } else {
            alert("Borrowed success!");
            location.href = '/borrow.html';
        }
    });
}