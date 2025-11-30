-- =============================================
-- Cleanup Orphaned Database Files
-- Run this if you get "file already exists" error
-- =============================================

USE master;
GO

PRINT '=============================================';
PRINT 'Cleaning up orphaned database files...';
PRINT '=============================================';
PRINT '';

-- Drop database if it exists
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'EduPortalDb')
BEGIN
    PRINT 'Dropping EduPortalDb database...';
    ALTER DATABASE EduPortalDb SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE EduPortalDb;
    PRINT 'Database dropped.';
    PRINT '';
END
ELSE
BEGIN
    PRINT 'Database not registered in SQL Server.';
    PRINT '';
END

-- Get the default data directory
DECLARE @DefaultData NVARCHAR(512);
DECLARE @DefaultLog NVARCHAR(512);

EXEC master.dbo.xp_instance_regread 
    N'HKEY_LOCAL_MACHINE', 
    N'Software\Microsoft\MSSQLServer\MSSQLServer',
    N'DefaultData', 
    @DefaultData OUTPUT;

EXEC master.dbo.xp_instance_regread 
    N'HKEY_LOCAL_MACHINE', 
    N'Software\Microsoft\MSSQLServer\MSSQLServer',
    N'DefaultLog', 
    @DefaultLog OUTPUT;

-- If registry values are NULL, use master database location
IF @DefaultData IS NULL
BEGIN
    SELECT @DefaultData = SUBSTRING(physical_name, 1, CHARINDEX(N'master.mdf', LOWER(physical_name)) - 1)
    FROM master.sys.master_files
    WHERE database_id = 1 AND file_id = 1;
END

IF @DefaultLog IS NULL
    SET @DefaultLog = @DefaultData;

PRINT 'Database file location:';
PRINT '  Data: ' + ISNULL(@DefaultData, 'Not found');
PRINT '  Log:  ' + ISNULL(@DefaultLog, 'Not found');
PRINT '';

-- Display files to delete manually
PRINT 'If files exist, delete them manually:';
PRINT '  1. Close SQL Server Management Studio';
PRINT '  2. Delete: ' + @DefaultData + 'EduPortalDb.mdf';
PRINT '  3. Delete: ' + @DefaultLog + 'EduPortalDb_log.ldf';
PRINT '';
PRINT 'Or use Windows Explorer to navigate to:';
PRINT '  ' + @DefaultData;
PRINT '  Look for EduPortalDb.mdf and EduPortalDb_log.ldf';
PRINT '';
PRINT '=============================================';
PRINT 'After deleting files, run SetupDatabase.sql';
PRINT '=============================================';

GO
