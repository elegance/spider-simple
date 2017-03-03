const mysql = require('mysql');
const cfg = require('./config');

// 只需要保持一个连接
var conn = mysql.createConnection(cfg.mysqlConnStr);

module.exports = new Promise((resolve, reject) => {
    conn.connect((err) => {
        if (err) {
            console.error('mysql 连接出现错误：', err);
            reject(err);
        }
        resolve(conn);
    });
});