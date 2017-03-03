CREATE TABLE `tb_news` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `news_type` varchar(50) DEFAULT NULL,
  `title` varchar(150) DEFAULT NULL,
  `href` varchar(50) DEFAULT NULL,
  `content` text,
  `origin_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `origin_id` varchar(50) DEFAULT NULL,
  `ist_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8