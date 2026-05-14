-- LinkE 协同平台 数据库建表脚本
-- MySQL 8.0 / InnoDB / utf8mb4

CREATE DATABASE IF NOT EXISTS linke
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE linke;

-- ============================================================
-- 用户表
-- ============================================================
CREATE TABLE users (
  id          VARCHAR(10)   PRIMARY KEY,
  name        VARCHAR(50)   NOT NULL,
  email       VARCHAR(100)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL COMMENT 'bcrypt hash',
  role        ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  avatar      VARCHAR(10)   DEFAULT '👤',
  dept        VARCHAR(50)   DEFAULT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 待办任务表
-- ============================================================
CREATE TABLE todos (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  user_id     VARCHAR(10)   NOT NULL,
  source      VARCHAR(50)   NOT NULL COMMENT '来源系统名称',
  title       VARCHAR(255)  NOT NULL,
  type        ENUM('审批','签字','预定','任务','业务推送') NOT NULL DEFAULT '任务',
  priority    ENUM('high','medium','low') NOT NULL DEFAULT 'medium',
  status      ENUM('pending','processing','done') NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  TIMESTAMP     NULL DEFAULT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_user_id (user_id),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 消息线程表
-- ============================================================
CREATE TABLE message_threads (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  type        ENUM('bot','group','user') NOT NULL,
  name        VARCHAR(100)  NOT NULL,
  color       VARCHAR(20)   DEFAULT 'bg-slate-800',
  tag         VARCHAR(20)   DEFAULT NULL,
  pinned      BOOLEAN       DEFAULT FALSE,
  created_by  VARCHAR(10)   DEFAULT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 消息历史表
-- ============================================================
CREATE TABLE message_history (
  id          BIGINT        AUTO_INCREMENT PRIMARY KEY,
  thread_id   INT           NOT NULL,
  sender_id   VARCHAR(10)   DEFAULT NULL,
  sender_type ENUM('self','other') NOT NULL DEFAULT 'other',
  sender_name VARCHAR(50)   DEFAULT NULL,
  type        ENUM('text','file') NOT NULL DEFAULT 'text',
  content     TEXT          NOT NULL,
  file_size   VARCHAR(20)   DEFAULT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (thread_id) REFERENCES message_threads(id),
  FOREIGN KEY (sender_id) REFERENCES users(id),
  INDEX idx_thread_id (thread_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 线程参与者表（多用户协同）
-- ============================================================
CREATE TABLE thread_participants (
  thread_id     INT         NOT NULL,
  user_id       VARCHAR(10) NOT NULL,
  unread        INT         DEFAULT 0,
  last_read_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (thread_id, user_id),
  FOREIGN KEY (thread_id) REFERENCES message_threads(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 系统集成表
-- ============================================================
CREATE TABLE integrations (
  id               VARCHAR(20)   PRIMARY KEY,
  name             VARCHAR(100)  NOT NULL,
  status           ENUM('connected','disconnected','error') NOT NULL DEFAULT 'disconnected',
  color            VARCHAR(20)   DEFAULT 'bg-blue-600',
  webhook_endpoint VARCHAR(255)  DEFAULT NULL,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 集成调用日志表
-- ============================================================
CREATE TABLE integration_logs (
  id              BIGINT        AUTO_INCREMENT PRIMARY KEY,
  integration_id  VARCHAR(20)   NOT NULL,
  direction       ENUM('push','pull') NOT NULL,
  source          VARCHAR(50)   NOT NULL,
  endpoint        VARCHAR(255)  NOT NULL,
  payload         TEXT          DEFAULT NULL,
  status          ENUM('success','error') NOT NULL DEFAULT 'success',
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (integration_id) REFERENCES integrations(id),
  INDEX idx_integration_id (integration_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
