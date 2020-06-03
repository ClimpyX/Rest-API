const application = require('./application');
const debug = require('debug')('rest-api:server');
const http = require('http');

const SERVER_ADDRESS = process.env.SERVER_ADDRESS || '0.0.0.0';
const PORT = process.env.SERVER_PORT || '3000';
application.set('port', PORT);

const SERVER = http.createServer(application);
const gracefulShutdown = () => {
    const mongoose = require('mongoose');
    if (mongoose.isClosed()) {
        return;
    }
    
    mongoose.connection.close(false, () => {
        console.log('MongoDB sunucusu kapatılmış durumda.');
      
        SERVER.close(() => {
            console.log('API sunucusu zorla kapatılıyor...');
        });
    });
};

SERVER.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var shutingDown = Boolean(false);    
    switch (error.code) {
        case 'EACCES':
            console.error('Şu anda kullanılmaya çalışılan ' + PORT + ' numaralı port yükseltilmiş ayrıcalıklar gerektirir..');
            shutingDown = Boolean(true);
            break;
        case 'EADDRINUSE':
            console.error('İşlem için dinlenmeye çalışılan ' + PORT + ' numaralı port zaten kullanılmakta olan bir porttur..');
            shutingDown = Boolean(true);
            break;
        default:
            throw error;
    }
    
    if (shutingDown) {
        console.log('API sunucusu zorla kapatılıyor...');
        process.exit(1);
    }
});

SERVER.listen(PORT, '0.0.0.0', () => {
  console.log(`Sunucu ${SERVER_ADDRESS}:${PORT} üzerinde yürütülüyor.`);

  process.on('uncaughtException', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
});