-- This is an example of a script you could invoke as part of your environment's 
-- setup workflow if you want to seed your ephemeral database at runtime rather
-- than than using a premade RDS, CloudSQL, or container snapshot. 
USE master
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ReleaseDemo')
  BEGIN
    PRINT 'Creating ReleaseDemo database';
    CREATE DATABASE ReleaseDemo;
  END
ELSE
  BEGIN
    PRINT 'Database `ReleaseDemo` already exists. No further setup needed.';
    SET NOEXEC ON;
  END
GO

USE ReleaseDemo;
GO

IF OBJECT_ID(N'[users]', N'U') IS NULL 
BEGIN   
  PRINT 'Creating users table...';
	CREATE TABLE [users] (
        [username] VARCHAR(50) NOT NULL,
        [environment_id] VARCHAR(100) NOT NULL
    );

    DECLARE @prod_environment as varchar(50);
    SET @prod_environment = 'prod_data';

    INSERT INTO [users] ([username], [environment_id])
    VALUES
        ('Kelsey', @prod_environment),
        ('Mat', @prod_environment),
        ('Jimmy', @prod_environment)
    ;
    PRINT 'Seeded table with sample data.';
END;
GO

SET NOEXEC OFF