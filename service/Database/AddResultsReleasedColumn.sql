-- Add ResultsReleased column to Assessments table
-- This allows teachers to control when students can view their assessment results

-- Check if column exists before adding
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Assessments' 
    AND COLUMN_NAME = 'ResultsReleased'
)
BEGIN
    ALTER TABLE Assessments
    ADD ResultsReleased BIT NOT NULL DEFAULT 0;
    
    PRINT 'ResultsReleased column added successfully';
END
ELSE
BEGIN
    PRINT 'ResultsReleased column already exists';
END
GO

-- Optional: Set existing published assessments to have results released
-- Comment this out if you want teachers to manually release results for existing assessments
-- UPDATE Assessments 
-- SET ResultsReleased = 1 
-- WHERE IsPublished = 1;
