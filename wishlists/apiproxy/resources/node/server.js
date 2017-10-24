var express = require('express');
var usergrid = require('usergrid');
var config = require('./config');
var apigee = require('apigee-access');
var app = express();
app.use(express.bodyParser());
var username = 'examuser';
var password = 'uGyF3ukQ1i1';
var userid = null;
var loggedIn;
var listid = null;

if (loggedIn === null || loggedIn === undefined) {
    //initialize the SDK
    var client = new usergrid.client({
        orgName : config.organization,
        appName : config.application,
        authType : usergrid.AUTH_APP_USER,
        URI : 'https://apigee-edu-prod.apigee.net/appservices/',
        logging : config.logging
    });
    client.login(username, password, function (err) {
        if (err) {
            //error - could not log user in
          token = null;
            console.log("error: Could not login."+err);
        } else {
            //success - user has been logged in
            console.log(client);
            //the login call will return an OAuth token, which is saved
            //in the client object for later use.  Access it this way:
            token = client.token;
            console.log(token);
            loggedIn = new usergrid.client({
                orgName  : config.organization,
                appName  : config.application,
                logging  : 'true',
                URI      : config.uri,
                buildCurl: 'true',
                token    : client.token,
              authType : usergrid.AUTH_APP_USER
            });
        }
    });
}

    
app.get('/', function(req, res) {
    userid = apigee.getVariable(req, 'accesstoken.username');
    loggedIn.createCollection({
		type : 'wishlists'
	}, function(err, wishlists) {
		if (err) {
			res.jsonp(500, {
				'error' : JSON.stringify(err)
			});
			return;
		}
		var emps = [];
		while (wishlists.hasNextEntity()) {
			var emp = wishlists.getNextEntity().get();
 			var e = {
 				'userid' : emp.userid || null,
 				'products' : emp.products,
 				'id' : emp.uuid,
 				'name' : emp.name || null
 			};
            if ((emp.userid == userid) && (userid !== null)) {
                emps.push(e);
            }
		}
		if (emps.length  === 0) {
            res.send(404);
        }
		res.jsonp(emps);
	});
});

app.get('/:listid', function(req, res) {
    userid = apigee.getVariable(req, 'accesstoken.username');
    listid = req.params.listid;
    loggedIn.createCollection({
		type : 'wishlists'
	}, function(err, wishlists) {
		if (err) {
			res.jsonp(500, {
				'error' : JSON.stringify(err)
			});
			return;
		}
		var content = [];
		while (wishlists.hasNextEntity()) {
			var emp = wishlists.getNextEntity().get();
 			var e = {
 				'userid' : emp.userid || null,
 				'products' : emp.products,
 				'id' : emp.uuid,
 				'name' : emp.name || null
 			};
            if ((e.userid === userid) && (e.id === listid)) {
                content.push(e);
            }
		}
        if (content.length  == 0) {
            res.send(404);
        }
		res.jsonp(content);
	});
});

app.delete('/:listid', function(req, res) {
    userid = apigee.getVariable(req, 'accesstoken.username');
    listid = req.params.listid;
    loggedIn.createCollection({
		type : 'wishlists'
	}, function(err, wishlists) {
            if (err) {
                res.jsonp(500, {
                    'error' : JSON.stringify(err)
                });
                return;
            }
            var okayToRemove = false;
            while (wishlists.hasNextEntity()) {
                var emp = wishlists.getNextEntity().get();
                if ((emp.userid === userid) && (emp.uuid === listid)) {
                    okayToRemove = true;
                }
            }
            if (!okayToRemove) {
                res.send(404);
            }
            else {
                var properties = {
            	    client:loggedIn,
            	    data:{
            		    'type':'wishlists',
            		    'uuid': listid
            	    }
                };
                var entity1 = new usergrid.entity(properties);
                entity1.destroy(function (error, result) {
                	if (error) { 
                	    res.send(500);
                	} else {
                	    res.send(200);
                	}
                });
            }

    });

});

app.put('/:listid', function(req, res) {
    userid = apigee.getVariable(req, 'accesstoken.username');
    listid = req.params.listid;
    if (!req.is('json')) {
		res.jsonp(400, {
			error : 'Bad request'
		});
		return;
	}
    var b = req.body;
	if ((b.products === undefined) || (b.products.length === 0) ) {
		res.jsonp(400, {
			error : 'Bad request'
		});
		return;
	}
    loggedIn.createCollection({
		type : 'wishlists'
	}, function(err, wishlists) {
            if (err) {
                res.jsonp(500, {
                    'error' : JSON.stringify(err)
                });
                return;
            }
            var entity = {};
            var okayToUpdate = false;
            while (wishlists.hasNextEntity()) {
                var emp = wishlists.getNextEntity().get();
                if ((emp.userid === userid) && (emp.uuid === listid)) {
                    entity = {
                        'userid' : emp.userid,
                        'products' : emp.products,
                        'id' : emp.uuid,
                        'name' : emp.name || null
                    };
                    okayToUpdate = true;
                }
            }
            if (!okayToUpdate) {
                res.send(404);
                return;
            }
            else {
                var properties = {
                    client: loggedIn, 
                    data : { 'type':'wishlists',
                        uuid : listid,
                        products : b.products
                    }
                };
                var entity1 = new usergrid.entity(properties);
                entity1.save(function (error, result) {
                    if (error) { 
                        res.jsonp(500, {
                            'error' : JSON.stringify(err)
                        });
                    } else { 
                        res.send(200);
                    }
                });
            }
    });
});

app.post('/:listid/products', function(req, res) {
    userid = apigee.getVariable(req, 'accesstoken.username');
    listid = req.params.listid;
    if (!req.is('json')) {
		res.jsonp(400, {
			error : 'Bad request'
		});
		return;
	}
    var b = req.body;
	if ((b.products === undefined) || (b.products.length === 0)) {
		res.jsonp(400, {
			error : 'Bad request'
		});
		return;
	}
    loggedIn.createCollection({
		type : 'wishlists'
	}, function(err, wishlists) {
            if (err) {
                res.jsonp(500, {
                    'error' : JSON.stringify(err)
                });
                return;
            }
            var entity = {};
            var okayToUpdate = false;
            while (wishlists.hasNextEntity()) {
                var emp = wishlists.getNextEntity().get();
                if ((emp.userid === userid) && (emp.uuid === listid)) {
                    entity = {
                        'userid' : emp.userid,
                        'products' : emp.products,
                        'id' : emp.uuid,
                        'name' : emp.name || null
                    };
                    okayToUpdate = true;
                }
            }
            if (!okayToUpdate) {
                res.send(404);
                return;
            }
            var properties = {
                client: loggedIn, 
                data : { 'type':'wishlists',
                    uuid : listid,
                    products : b.products.concat(entity.products)
                }
            };
            var entity1 = new usergrid.entity(properties);
            entity1.save(function (error, result) {
                if (error) { 
                    res.jsonp(500, {
                        'error' : JSON.stringify(err)
                    });
                } else { 
                    res.send(200);
                }
            });
    });
});

function difference(source, toRemove) {
    source = source.filter( function( el ) {
        return toRemove.indexOf( el ) < 0;
    } );
    return source;
}

app.delete('/:listid/products', function(req, res) {
    userid = apigee.getVariable(req, 'accesstoken.username');
    listid = req.params.listid;
    if (!req.is('json')) {
		res.jsonp(400, {
			error : 'Bad request'
		});
		return;
	}
    var b = req.body;
	if ((b.products === undefined) || (b.products.length === 0)) {
		res.jsonp(400, {
			error : 'Bad request'
		});
		return;
	}
    loggedIn.createCollection({
		type : 'wishlists'
	}, function(err, wishlists) {
            if (err) {
                res.jsonp(500, {
                    'error' : JSON.stringify(err)
                });
                return;
            }
            var entity = {};
            var okayToUpdate = false;
            while (wishlists.hasNextEntity()) {
                var emp = wishlists.getNextEntity().get();
                if ((emp.userid == userid) && (emp.uuid === listid)) {
                    entity = {
                        'userid' : emp.userid,
                        'products' : emp.products,
                        'id' : emp.uuid,
                        'name' : emp.name
                    };
                    okayToUpdate = true;
                }
            }
            if (!okayToUpdate) {
                res.send(404);
                return;
            }
            var properties = {
                client: loggedIn, 
                data : { 'type':'wishlists',
                    uuid : listid,
                    products : difference(entity.products, b.products)
                }
            };
            var entity1 = new usergrid.entity(properties);
            entity1.save(function (error, result) {
                if (error) { 
                    res.jsonp(500, {
                        'error' : JSON.stringify(err)
                    });
                } else { 
                    res.send(200);
                }
            });
    });
});



app.post('/', function(req, res) {
    userid = apigee.getVariable(req, 'accesstoken.username');
	if (!req.is('json')) {
		res.jsonp(400, {
			error : 'Bad request'
		});
		return;
	}
	var b = req.body;
	var e = {
		'products' : b.products,
		'userid' : userid,
		'name' : b.name
	};
	if ((e.products === undefined) || (e.products.length === 0) || (e.userid === null)) {
		res.jsonp(400, {
			error : 'Bad request'
		});
		return;
	}
	createWishlist(e, req, res);
});

function createWishlist(e, req, res) {
	var opts = {
		type : 'wishlists'
	};

	loggedIn.createEntity(opts, function(err, o) {
		if (err) {
			res.jsonp(500, err);
			return;
		}
		o.set(e);
		o.save(function(err) {
			if (err) {
				res.jsonp(500, err);
				return;
			}
			res.jsonp(201, o._data.uuid);
		});
	});
}

// function getWishlist(req, res) {
//     userid = apigee.getVariable(req, 'accesstoken.username');

// }

// Listen for requests until the server is stopped

app.listen(process.env.PORT || 9000);
console.log('The server is running!');