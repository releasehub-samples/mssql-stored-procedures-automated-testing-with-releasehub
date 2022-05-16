USE master
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ReleaseDemo')
BEGIN
  CREATE DATABASE ReleaseDemo;
END;
GO

USE ReleaseDemo;
GO

IF OBJECT_ID(N'[users]', N'U') IS NULL 
BEGIN   
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
END;
GO