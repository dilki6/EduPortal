# AI-Powered Grading Feature

## Overview
This feature allows teachers to use AI-assisted grading for text-based and essay questions in assessments. The system provides AI suggestions that teachers can accept or manually adjust.

## Features Implemented

### 1. Individual Answer Evaluation
- Each text/essay question has an "Evaluate with AI" button with a sparkles icon
- Clicking evaluates that specific answer using AI
- AI score is automatically populated in the manual score input field
- Teachers can adjust the score before saving

### 2. Bulk Evaluation
- "Evaluate All with AI" button at the top of the page (with lightning bolt icon)
- Evaluates all text-based answers across all expanded student attempts
- Processes evaluations in parallel for efficiency
- Shows count of evaluated answers in toast notification

### 3. Manual Score Adjustment
- Each text question has an input field for manual score entry
- Validates score is between 0 and the maximum points for that question
- Supports decimal scores (0.5 increments)
- Input field pre-populated with current score or AI-suggested score

### 4. Save Functionality
- "Save Scores" button shows count of modified scores
- Only enabled when scores have been changed
- Saves all modified scores to the database in batch
- Automatically recalculates total attempt score
- Refreshes the display after successful save
- Provides feedback via toast notifications

## Technical Implementation

### Backend Changes

#### New Endpoint
**PUT** `/api/assessments/answers/{answerId}/score`
- Authorization: Teacher role required
- Request body: `{ "score": number }`
- Validates score is within valid range (0 to question max points)
- Updates answer score and recalculates attempt total

#### New DTO
```csharp
public class UpdateScoreDto
{
    public decimal Score { get; set; }
}
```

#### Service Method
```csharp
Task<bool> UpdateAnswerScoreAsync(string answerId, decimal score)
```
- Validates answer exists
- Checks score is within valid range
- Updates answer points earned
- Recalculates total attempt score
- Persists changes to database

### Frontend Changes

#### New State Management
- `evaluatingAnswers`: Set<string> - Tracks which answers are being evaluated
- `evaluatingAll`: boolean - Loading state for bulk evaluation
- `manualScores`: Map<string, number> - Stores modified scores by answer ID
- `savingScores`: boolean - Loading state for save operation

#### AI Evaluation Function
```typescript
evaluateWithAI(answer: Answer): Promise<number>
```
**Current Implementation**: Simple keyword matching algorithm
- Compares student answer with expected answer
- Calculates match percentage based on word overlap
- Returns suggested score proportional to match percentage

**Production Recommendation**: Replace with actual AI API integration
- OpenAI GPT-4 for natural language understanding
- Custom fine-tuned models for specific subject areas
- Consider factors: completeness, accuracy, clarity, relevance

#### Key Functions
1. `handleEvaluateSingle(answerId, answer)` - Evaluate one answer
2. `handleEvaluateAll()` - Evaluate all text answers in expanded attempts
3. `handleManualScoreChange(answerId, value, maxPoints)` - Update score with validation
4. `handleSaveScores()` - Batch save all modified scores

#### UI Components
- Individual evaluate button per text answer (purple accent)
- Bulk evaluate button in header (purple background)
- Save scores button in header (shows modified count)
- Number input field for manual scoring (0 to max points)
- Loading spinners during evaluation/save
- Toast notifications for feedback

### API Integration
Added to `lib/api.ts`:
```typescript
updateAnswerScore: (answerId: string, score: number) =>
  apiClient.put<{ message: string }>(`/assessments/answers/${answerId}/score`, { score })
```

## User Workflow

### Teacher Grading Process
1. Navigate to "Review Answers" page
2. Select course and assessment
3. Expand student attempts to view answers
4. For text questions, choose either:
   - Click "Evaluate with AI" on individual answers
   - Click "Evaluate All with AI" to grade all at once
5. Review AI-suggested scores (auto-populated in input fields)
6. Manually adjust any scores as needed
7. Click "Save Scores (N)" button to persist changes
8. System recalculates total scores and updates display

### Visual Indicators
- Purple sparkles icon: Individual AI evaluation
- Purple lightning bolt icon: Bulk AI evaluation  
- Green save icon: Save modified scores
- Badge showing count: Number of unsaved score changes
- Loading spinners: During AI evaluation or save operations
- Color-coded answer cards: Green (full), yellow (partial), red (zero points)

## AI Grading Algorithm (Current)

The current implementation uses a simple keyword matching approach:
1. Converts both answers to lowercase
2. Splits expected answer into words (filters words < 4 chars)
3. Checks how many expected keywords appear in student answer
4. Calculates match percentage
5. Applies percentage to maximum points
6. Rounds to nearest integer

### Example
- Question: "Explain photosynthesis" (10 points)
- Expected: "process where plants convert sunlight into energy using chlorophyll"
- Student: "plants use sunlight and chlorophyll to make energy through photosynthesis"
- Keywords matched: plants, sunlight, chlorophyll, energy (4/6 = 67%)
- Score: 7/10 points

### Production Upgrade Path
Replace `evaluateWithAI` function with:
```typescript
const evaluateWithAI = async (answer: Answer) => {
  const response = await fetch('/api/ai/evaluate', {
    method: 'POST',
    body: JSON.stringify({
      question: answer.questionText,
      expectedAnswer: answer.expectedAnswer,
      studentAnswer: answer.textAnswer,
      maxPoints: answer.questionPoints
    })
  });
  return response.json();
};
```

Backend AI service could use:
- OpenAI API for semantic understanding
- Rubric-based scoring with configurable criteria
- Confidence scores to flag uncertain evaluations
- Explanation generation for score justification

## Database Impact

### Modified Entities
- `Answer.PointsEarned` - Updated when teacher saves scores
- `AssessmentAttempt.Score` - Recalculated as sum of all answer scores

### Data Flow
1. Teacher modifies score → Stored in frontend Map
2. Click save → Batch API calls to update each modified answer
3. Backend validates and updates `Answer.PointsEarned`
4. Backend recalculates and updates `AssessmentAttempt.Score`
5. Frontend refreshes to show updated scores

## Security Considerations

### Authorization
- Only teachers can update scores (enforced via `[Authorize(Roles = "Teacher")]`)
- Score validation prevents invalid inputs (negative or exceeding max)
- Students cannot see or modify grading interface

### Validation
- Client-side: Input type="number" with min/max constraints
- Server-side: Double-checks score range in service layer
- Type safety: Decimal handling for fractional scores

## Performance Optimizations

### Parallel Processing
- Bulk evaluation runs all AI requests in parallel using `Promise.all`
- Batch save operations grouped into single API call array
- Reduces total wait time significantly

### Efficient Re-rendering
- Uses Map/Set data structures for O(1) lookups
- Only re-fetches data for expanded attempts after save
- Optimistic UI updates for better UX

### Loading States
- Granular loading indicators (per-answer and global)
- Disabled buttons prevent duplicate submissions
- Visual feedback throughout async operations

## Future Enhancements

### Potential Additions
1. **AI Rubric Scoring**: Define scoring criteria for different aspects
2. **Partial Credit Suggestions**: AI recommends point breakdown
3. **Plagiarism Detection**: Flag potentially copied answers
4. **Feedback Generation**: AI suggests constructive comments
5. **Historical Learning**: Improve AI based on teacher adjustments
6. **Batch Grading Queue**: Process large volumes asynchronously
7. **Export Grading Report**: Download detailed evaluation summaries
8. **Compare with Exemplars**: Show high-scoring example answers

### Integration Ideas
- Integration with LMS platforms (Canvas, Blackboard, Moodle)
- Custom AI model training per subject/teacher
- Student appeal mechanism for disputed grades
- Analytics dashboard for grading patterns
- Accessibility features (screen reader support, keyboard shortcuts)

## Testing Recommendations

### Unit Tests
- Test score validation logic (boundary conditions)
- Test AI algorithm with various answer combinations
- Test total score recalculation accuracy

### Integration Tests
- Test full flow: evaluate → modify → save → refresh
- Test concurrent evaluations don't conflict
- Test error handling (network failures, invalid data)

### E2E Tests
- Teacher evaluates multiple students
- Bulk evaluation across many answers
- Save and verify scores persist correctly
- Check student view remains unchanged until results released

## Known Limitations

1. **Simple AI Algorithm**: Current keyword matching is basic - needs upgrade for production
2. **No Explanation**: AI doesn't provide reasoning for scores (teachers may want justification)
3. **No Undo**: Once saved, score changes are permanent (could add history tracking)
4. **Manual Review Required**: System requires teacher oversight - not fully automated
5. **English Only**: Current implementation may not work well for other languages

## Troubleshooting

### Common Issues

**Scores not saving**
- Check browser console for API errors
- Verify teacher is logged in with correct role
- Ensure scores are within valid range (0 to max points)

**AI evaluation not working**
- Check if answers have expected answers defined
- Verify evaluateWithAI function completes without errors
- Check network tab for failed requests (when using real AI API)

**Incorrect total scores**
- Verify all answers are included in recalculation
- Check for rounding issues with decimal scores
- Ensure database transaction completes successfully

**Button disabled unexpectedly**
- Check if any evaluation is in progress (evaluatingAll or evaluatingAnswers)
- Verify expandedStudents has entries for bulk evaluation
- Check manualScores map has entries for save button

## Configuration

### Adjustable Parameters
```typescript
// Simulated API delay (remove in production)
setTimeout(..., 1500); // in evaluateWithAI function

// Score increment step
step={0.5} // in Input component for manual scores

// Minimum word length for keyword matching
.filter(w => w.length > 3) // in evaluateWithAI function
```

### Environment Variables (for production AI)
```
OPENAI_API_KEY=your_key_here
AI_MODEL=gpt-4
AI_TEMPERATURE=0.3
MAX_TOKENS=150
```

## Conclusion

This AI grading feature significantly reduces manual grading time for teachers while maintaining oversight and quality control. The current implementation provides a solid foundation that can be enhanced with more sophisticated AI models and additional features based on user feedback and requirements.
