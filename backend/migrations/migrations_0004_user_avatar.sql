-- 添加用户头像字段
-- 注意：如果列已存在，此迁移会失败，但不会影响数据库状态
-- 在生产环境中，如果遇到 "duplicate column" 错误，可以安全地跳过此迁移
-- 使用 INSERT OR IGNORE 模式无法应用于 ALTER TABLE，所以需要手动处理

-- 由于 SQLite 不支持 IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- 如果列已存在，此语句会失败，但这是预期的行为
-- 管理员需要手动跳过已执行的迁移或忽略此错误

ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT '';

