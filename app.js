module.exports = function() {
    var express = require('express'),
        path = require('path'),
        app = express(),
        version = require('./version.json');

    app.enable('trust proxy');
    app.set('trust proxy', 'loopback, linklocal, uniquelocal');
    app.use('/public', express.static(path.join(__dirname, 'public')));
    app.use('/fonts', express.static(path.join(__dirname, 'public/fonts')));


    app.use('/*', function (req, res, next) {
        res.setHeader('content-type', 'text/html');
        return res.sendFile(path.join(__dirname, 'public/index.html'));
    });
    

    app.get('/version.json', function(req, res, next) {
        return res.json(version);
    });

    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.send({
          message: err.message,
          error: {}
      });
    });

    return app;
};
