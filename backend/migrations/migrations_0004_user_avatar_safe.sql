-- 添加用户头像字段（安全版本，检查列是否存在）
-- 注意：SQLite 不支持 IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- 如果列已存在，此迁移会失败，但不会影响数据库状态
-- 在生产环境中，如果遇到 "duplicate column" 错误，可以安全地跳过此迁移

-- 尝试添加列（如果已存在会失败，但不会破坏数据库）
-- 在生产环境中，建议先检查列是否存在
-- 可以使用以下 SQL 检查：
-- SELECT COUNT(*) FROM pragma_table_info('users') WHERE name='avatar';

-- 如果返回 0，则列不存在，可以执行 ALTER TABLE
-- 如果返回 1，则列已存在，跳过此迁移

-- 由于 wrangler 不支持条件逻辑，这里直接执行 ALTER TABLE
-- 如果列已存在，迁移会失败，但这是预期的行为
-- 管理员需要手动跳过已执行的迁移

ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT '';

