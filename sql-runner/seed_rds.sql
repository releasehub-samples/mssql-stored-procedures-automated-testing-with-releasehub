-- # This file is not yet fully automated within the demo. See below for manual instructions. 

-- After we create our mock "production" RDS MSSQL database with the CDK project in /rds-cdk, 
-- we connect to the database (e.g. using Azure Data Studio), and run the commands below to 
-- create an initial table. 
--
-- Then, we take a manual RDS snapshot of the database (or wait for an automated snapshot to 
-- generate during the next backup window). This snapshot will be used as the source snapshot
-- for RDS instant datasets and ephemeral testing against these datasets.
-- 
-- The setup below and subsequent manual snapshot are one-time activities to perform before
-- launching an environment with Release. 

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