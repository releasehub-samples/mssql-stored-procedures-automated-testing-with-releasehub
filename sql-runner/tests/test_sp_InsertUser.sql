:on error exit

USE ReleaseDemo;
GO

SET NOCOUNT ON;
DECLARE @command VARCHAR(255);
SET @command = "InsertUser @username = 'Ted', @environment_id = '$(RELEASE_ENVIRONMENT_ID)'"
PRINT "Running command: EXEC " + @command
EXEC (@command)
GO