-- places2love — MySQL 5.7+ schema
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(190) NOT NULL,
  name          VARCHAR(120) NOT NULL DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  locale        VARCHAR(10)  NOT NULL DEFAULT 'de',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  token      CHAR(64) NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (token),
  KEY idx_user (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS places (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED NOT NULL,
  title           VARCHAR(200) NOT NULL,
  category        VARCHAR(60)  NOT NULL DEFAULT 'Berg',
  custom_category VARCHAR(100) NOT NULL DEFAULT '',
  country         VARCHAR(80)  NOT NULL DEFAULT '',
  country_flag    VARCHAR(8)   NOT NULL DEFAULT '',
  region          VARCHAR(120) NOT NULL DEFAULT '',
  lat             DECIMAL(9,6) DEFAULT NULL,
  lng             DECIMAL(9,6) DEFAULT NULL,
  visited_on      DATE NOT NULL,
  rating          TINYINT UNSIGNED NOT NULL DEFAULT 0,
  difficulty      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  revisit         ENUM('ja','vielleicht','nein') NOT NULL DEFAULT 'vielleicht',
  entry_cents     INT UNSIGNED NOT NULL DEFAULT 0,
  duration        VARCHAR(60)  NOT NULL DEFAULT '',
  note            TEXT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_visited (user_id, visited_on),
  CONSTRAINT fk_places_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS place_tags (
  place_id INT UNSIGNED NOT NULL,
  tag      VARCHAR(60)  NOT NULL,
  PRIMARY KEY (place_id, tag),
  CONSTRAINT fk_tag_place FOREIGN KEY (place_id)
    REFERENCES places(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS place_links (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  place_id   INT UNSIGNED NOT NULL,
  url        VARCHAR(500) NOT NULL,
  label      VARCHAR(120) NOT NULL DEFAULT '',
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_place_link (place_id, sort_order),
  CONSTRAINT fk_link_place FOREIGN KEY (place_id)
    REFERENCES places(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS place_photos (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  place_id   INT UNSIGNED NOT NULL,
  path       VARCHAR(400) NOT NULL,
  width      INT UNSIGNED DEFAULT NULL,
  height     INT UNSIGNED DEFAULT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_place_photo (place_id, sort_order),
  CONSTRAINT fk_photo_place FOREIGN KEY (place_id)
    REFERENCES places(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
