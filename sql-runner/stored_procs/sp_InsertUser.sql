USE ReleaseDemo;
GO

CREATE OR ALTER PROCEDURE InsertUser @username VARCHAR(50) = NULL, @environment_id VARCHAR(100) = NULL
AS
BEGIN
    INSERT INTO [users] ([username], [environment_id])
    VALUES
        (ISNULL(@username, '<no_user_provided>'), ISNULL(@environment_id, '<no_environment_id_provided>'))
    ;
END
GO