const request = require('superagent');
const cheerio = require('cheerio');
const Promise = require('bluebird');
var argv = require('yargs').argv;
const db = require('./db');

const concurrency = parseInt(argv.c || 1); // 并发数默认为1
const interval = (argv.i ? argv.i * 1000 : 30 * 1000); //刷新频率默认30秒
const sleepTime = (argv.s ? argv.s * 1000 : 0.5 * 1000); // 并发间隔时间
let running = false;

let runFn = () => {
    if (!running) {
        run()
            .catch(err => {
                console.error(err);
            });
    }
};

setInterval(runFn, interval);

runFn();

async function run() {
    running = true;

    console.log('取首页资讯列表。');
    let items = await getMainPageItems();

    items.map(item => {
        item.id = item.href.replace(/\D/g, ''); 
        return item;
    });

    let currentIds = items.map(item => item.id);
    console.log(`首页有 ${currentIds.length}篇资讯。`);

    console.log('从数据库判断资讯是否已经存在。');
    let existIds = await queryExistId(currentIds);
    items = items.filter((item) => existIds.indexOf(item.id) === -1);

    if (items.length > 0) {
        console.log(`开始抓取 ${items.length}篇资讯。`);
    } else {
        console.log(`资讯都已经存在，没有新的资讯。`);
    }

    Promise.map(items, (item) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                getUrlContent(item.href).then((content) => {
                    resolve();
                    console.log(`已抓取：${item.title}`)
                    item.content = content;
                    saveItemToDb(item);
                });
            }, sleepTime);
        });
    }, {
        concurrency
    }).then(() => {
        console.log('done! （等待程序自动刷新）');
        running = false;
    }).catch((err) => {
        console.error(err);
        running = false;
    });
}

// 检查数据库中是否已经存在
async function queryExistId(ids) {
    const conn = await db;
    return new Promise((resolve, reject) => {
        conn.query(`SELECT origin_id FROM tb_news WHERE origin_id IN(?)`, [ids], (err, rows) => {
            resolve(rows.map(row => row.origin_id));
        });
    });
}

// 保存到数据库
async function saveItemToDb(item) {
    const conn = await db;
    await new Promise((resolve, reject) => {
        conn.query(`INSERT INTO tb_news (news_type, title, href, content, origin_time, origin_id) 
            VALUES(?, ?, ?, ?, ?, ?)`, [item.newsType, item.title, item.href, item.content, item.dateTime, item.id], (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
    });
}

// 新闻列表
async function getMainPageItems() {
    let res = await request.get('http://kuaixun.stcn.com/index.shtml#')
    let $ = cheerio.load(res.text, {decodeEntities: false});
    let items = [];

    // 分析页面元素，取得需要的内容
    $('#mainlist > ul > li').each((idx,  ele) => {
        let $li = $(ele),
            $aEles = $li.find('a'),
            $typeEle = $($aEles[0]),
            $titleEle = $($aEles[1]),
            $timeEle = $li.find('span');

        items.push({
            newsType: $typeEle.text().replace(/【(.+)】/, ($, $1) => $1),
            title: $titleEle.text(),
            href: $titleEle.attr('href'),
            dateTime: $timeEle.text().replace(/\[(.+)\]/, ($, $1) => $1)
        });
    });
    return items;
}

// 新闻内容
async function getUrlContent(url) {
   let res = await request(url);
   let $ = cheerio.load(res.text, {decodeEntities: false});
   let $mainDiv = $('#ctrlfscont');
   $mainDiv.find('div.adv').remove().end().find('p').eq(0).remove();
   return $mainDiv.html();
}