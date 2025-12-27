-- Create user and database
-- Run this as postgres superuser

-- Create the database
CREATE DATABASE wedding_planner;

-- Connect to the database
\c wedding_planner

-- Create the user (using email as username)
CREATE USER "anthony@arrebolweddings.com" WITH PASSWORD 'Lalo9513.-';

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE wedding_planner TO "anthony@arrebolweddings.com";
GRANT ALL ON SCHEMA public TO "anthony@arrebolweddings.com";

-- Now run the main schema
\i schema.sql
