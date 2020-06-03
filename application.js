const createError = require('http-errors');
const express = require('express');

const path = require('path');
const rateLimit = require("express-rate-limit");
const responseTime = require('./middleware/response-time');
const ignoreFavicon = require('./middleware/favicon-ignore');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

require('dotenv').config();
require('./database/mongo-database');
require('./database/redis-database');

const application = express();
application.set('views', path.join(__dirname, 'views'));
application.set('view engine', 'jade');

application.use(logger('dev'));
application.use(express.json());
application.use(responseTime());
application.use(rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100
}));

application.use(express.urlencoded({ 
    extended: false 
}));

application.use(cookieParser());
application.use(express.static(path.join(__dirname, 'public')));
application.use(ignoreFavicon());

/*ROUTES SECTION START*/
const indexRouter = require('./routes/index');
const configurationRouter = require('./routes/configuration');
const authenticationRouter = require('./routes/authentication');
const serverRouter = require('./routes/server');
const userRouter = require('./routes/user');

application.use('/', indexRouter);
application.use('/configuration', configurationRouter);
application.use('/authentication', authenticationRouter);
application.use('/server', serverRouter);
application.use('/user', userRouter);
/*ROUTES SECTION END*/

application.use((request, response, next) => {
    response.message = 'Girilen URL ile eşleşen bir değer bulunamadı.';
    renderErrorPage(new Error('Not Found', 404), request, response, next);
});

application.use((errorCallback, request, response, next) => {
    renderErrorPage(errorCallback, request, response, next);
});

const renderErrorPage = (errorCallback, request, response, next) => {
    response.locals.message = errorCallback.message;
    
    response.locals.error = request.app.get('env') === 'development' ? errorCallback : {};
    response.status(errorCallback.status || 500);
    
    response.render('error', {
        message: {
            error: errorCallback.message,
            errorMessage: response.message
        }
    });
};

module.exports = application;
