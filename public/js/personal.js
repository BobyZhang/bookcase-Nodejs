
function MyBorrowBook() {
    Book.call(this); // for interitance
    
    var tableHTML = '<td class="book-title"></td><td class="borrow-time"></td><td class="return"></td>'
    
    this.myBorrowNode = $('<tr></<tr>').html(tableHTML);
}
inheritPrototype(MyBorrowBook, Book);

MyBorrowBook.prototype.showList = function () {
    this.show();
    
    var objBook = this;

    // create an add book botton
    var button = $('<button>归 还</button>')
    button.addClass('submit-return');
    
    button.click(function () {
        submitReturn(objBook);
    });
    
    $('.return', this.myBorrowNode).append(button);
    
    // change the user name
    //$('.username').html(this.)
}

function getMyBorrowed() {
    
    var url = '/auth/getBorrowedBook?member_id=' + CookieUtil.get('identify');
    
    $.ajax({
        url: url,
        type: 'get',
        async: true
    })
    .done(function (resData) {
        var res = JSON.parse(resData);
        console.log(res);
        showList(res);
    });
}


// start 
//
//
var pageTitle = document.title;

switch (pageTitle) {
    case 'Continue-personal':
        handlePersonalPage();
        break;
}

function handlePersonalPage() {
    $('#public-nav .borrow').css('color', '#767779');
    $('#public-nav .donate').css('color', '#767779');
    $('#public-nav .wunderlist').css('color', '#767779');
    
    getMyBorrowed();
}

function submitReturn(objBook) {
    console.log(objBook.bookInf)
    
    var url = '/book/return?member_id=' + CookieUtil.get('identify') +
      '&book_id=' + objBook.bookInf.book_id;
      
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
            location.href = '/personal.html';
        }
    });
}