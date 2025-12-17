# Results Release Feature

## Overview
This feature allows teachers to control when students can view their assessment results. Students can submit assessments, but they won't be able to see their scores or review their answers until the teacher explicitly releases the results.

## Changes Made

### Backend Changes (C#/.NET)

#### 1. Database Model Updates
- **File**: `service/EduPortal.Api/Models/Assessment.cs`
- Added `ResultsReleased` boolean property to the `Assessment` model
- Default value: `false`

#### 2. DTOs Updated
- **File**: `service/EduPortal.Api/DTOs/AssessmentDTOs.cs`
- Added `ResultsReleased` property to `AssessmentDto`
- Added `ResultsReleased` property to `AssessmentAttemptDto`

#### 3. New API Endpoints
- **File**: `service/EduPortal.Api/Controllers/AssessmentsController.cs`
- **POST** `/api/assessments/{id}/release-results` - Release results for an assessment (Teacher only)
- **POST** `/api/assessments/{id}/withdraw-results` - Withdraw released results (Teacher only)

#### 4. Service Layer Updates
- **File**: `service/EduPortal.Api/Services/AssessmentService.cs`
- Added `ReleaseResultsAsync()` method
- Added `WithdrawResultsAsync()` method
- Updated DTO mapping to include `ResultsReleased` property

#### 5. Authorization for Viewing Answers
- **File**: `service/EduPortal.Api/Controllers/AssessmentsController.cs`
- Updated `GetAttemptAnswers` endpoint to check:
  - Teachers can always view answers
  - Students can only view answers if `ResultsReleased` is `true`
  - Returns `403 Forbidden` if student tries to access unreleased results

#### 6. Database Migration
- **File**: `service/Database/AddResultsReleasedColumn.sql`
- SQL script to add `ResultsReleased` column to the Assessments table

### Frontend Changes (React/TypeScript)

#### 1. Type Definitions
- **File**: `web/src/lib/api.ts`
- Added `resultsReleased?: boolean` to `Assessment` interface
- Added `resultsReleased?: boolean` to `AssessmentAttempt` interface
- Added `releaseResults()` and `withdrawResults()` API methods

#### 2. Teacher Interface - Assessment Management
- **File**: `web/src/pages/AssessmentManagement.tsx`
- Added "Release Results" / "Results Released" button for each published assessment
- Added visual badges showing result release status:
  - Blue "Results Released" badge when released
  - Orange "Results Pending" badge when not released
- Button is only visible for published assessments
- Toggle functionality to release/withdraw results

#### 3. Student Interface - My Courses
- **File**: `web/src/pages/MyCourses.tsx`
- Updated to show different UI based on result release status:
  - **Results Released**: Shows score, percentage, and "View My Answers" button
  - **Results Not Released**: Shows "Assessment Submitted" message with pending status
  - "Results Pending" button (disabled) when results are not released
  - Orange/amber colored card indicating pending results

#### 4. Student Interface - Review Attempt
- **File**: `web/src/pages/StudentReviewAttempt.tsx`
- Added conditional rendering based on `resultsReleased` status:
  - **Results Not Released**: Shows submission confirmation with waiting message
  - **Results Released**: Shows full results including:
    - Score and percentage
    - Detailed answers review
    - Correct/incorrect indicators
    - Points breakdown

## User Workflows

### Teacher Workflow
1. Create and publish an assessment
2. Students take the assessment
3. Teacher reviews submissions (can always see all answers)
4. When ready, teacher clicks "Release Results" button
5. Students can now view their scores and answers
6. Teacher can withdraw results if needed by clicking the button again

### Student Workflow
1. Take a published assessment
2. Submit answers
3. See "Assessment Submitted" status
4. Wait for teacher to release results
5. Once released, view score and review answers
6. If results are withdrawn, access is removed again

## Database Migration

Run the following SQL script to add the new column:

```bash
# Using SQL Server Management Studio or Azure Data Studio
# Open and execute: service/Database/AddResultsReleasedColumn.sql
```

Or run directly:
```sql
ALTER TABLE Assessments
ADD ResultsReleased BIT NOT NULL DEFAULT 0;
```

## Security Considerations

- **Authorization**: Students cannot access answer details if results are not released
- **API Protection**: Teacher-only endpoints are protected with `[Authorize(Roles = "Teacher")]`
- **Client-side Protection**: Frontend checks results release status before displaying sensitive information
- **Server-side Validation**: Backend enforces access control regardless of frontend state

## Testing Checklist

- [ ] Teacher can release results for a published assessment
- [ ] Teacher can withdraw results after releasing
- [ ] Student cannot view answers when results are not released
- [ ] Student can view answers when results are released
- [ ] API returns 403 when student tries to access unreleased answers
- [ ] UI correctly shows "Results Pending" for unreleased assessments
- [ ] UI correctly shows scores and "View My Answers" for released results
- [ ] Database migration runs successfully

## Future Enhancements

- Add notification system to alert students when results are released
- Add scheduled release (auto-release on a specific date/time)
- Add bulk release for multiple assessments
- Add partial release (release to specific students)
- Add result analytics before releasing to all students
