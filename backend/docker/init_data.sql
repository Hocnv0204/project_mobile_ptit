-- Seed data: level (A1 -> C2)
INSERT INTO level (name, description, delete_flag, created_at, updated_at)
SELECT v.name, NULL, FALSE, NOW(), NOW()
FROM (
  VALUES
    ('A1'),
    ('A2'),
    ('B1'),
    ('B2'),
    ('C1'),
    ('C2')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM level l WHERE l.name = v.name
);
