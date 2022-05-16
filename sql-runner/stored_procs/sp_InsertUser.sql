:on error exit

USE ReleaseDemo;
GO

CREATE OR ALTER PROCEDURE InsertUser @username VARCHAR(50), @environment_id VARCHAR(100)
AS
BEGIN
    INSERT INTO [users] ([username], [environment_id])
    VALUES (@username, @environment_id)
    ;
    PRINT "Inserted user '" + @username + "', environment '" + @environment_id + "' into users table.";
END
GO

PRINT 'Created stored procedure InsertUser'
GO