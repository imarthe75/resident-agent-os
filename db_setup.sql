DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'kiwi_user') THEN
        CREATE ROLE kiwi_user WITH LOGIN PASSWORD 'kiwi_secure_password_2026';
    END IF;
END
$$;

SELECT 'CREATE DATABASE kiwi_db WITH OWNER = kiwi_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'kiwi_db')\gexec

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'plane_user') THEN
        CREATE ROLE plane_user WITH LOGIN PASSWORD 'plane_secure_password_2026';
    END IF;
END
$$;

SELECT 'CREATE DATABASE plane_db WITH OWNER = plane_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'plane_db')\gexec
