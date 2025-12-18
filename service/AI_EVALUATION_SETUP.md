# AI Evaluation Setup Guide

## Overview

EduPortal includes AI-powered evaluation for open-ended questions (ShortAnswer and Essay types). The system uses OpenAI's GPT-4o-mini model for cost-effective, intelligent grading.

## Features

- **Automated Grading**: AI evaluates student answers against expected answers and question context
- **Constructive Feedback**: Provides explanations for scores
- **Confidence Scoring**: Indicates AI's confidence in the evaluation
- **Fallback Mechanism**: Uses keyword matching if OpenAI API is unavailable
- **Teacher Override**: Teachers can always manually adjust AI-suggested scores

## Architecture

### Backend Components

1. **AiEvaluationService.cs**
   - Handles OpenAI API integration
   - Implements fallback keyword matching
   - Parses and validates AI responses

2. **AssessmentsController.cs**
   - `/api/assessments/evaluate` endpoint
   - Accepts question, expected answer, student answer, and max points
   - Returns suggested score, feedback, and confidence

3. **Configuration**
   - OpenAI API key stored in `appsettings.json`
   - Can be overridden with environment variables

### Frontend Integration

- **ReviewAnswers.tsx**: Updated to call real API instead of mock evaluation
- Fallback to client-side keyword matching if API fails
- Real-time evaluation with progress indicators

## Setup Instructions

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (it will only be shown once)

### 2. Configure API Key

#### Option A: appsettings.json (Development)

Edit `service/EduPortal.Api/appsettings.json`:

```json
{
  "OpenAI": {
    "ApiKey": "sk-proj-your-api-key-here"
  }
}
```

⚠️ **Security Warning**: Never commit API keys to version control!

#### Option B: User Secrets (Recommended for Development)

```bash
cd service/EduPortal.Api
dotnet user-secrets set "OpenAI:ApiKey" "sk-proj-your-api-key-here"
```

#### Option C: Environment Variables (Production)

Set the environment variable:

**Windows (PowerShell):**
```powershell
$env:OpenAI__ApiKey = "sk-proj-your-api-key-here"
```

**Linux/macOS:**
```bash
export OpenAI__ApiKey="sk-proj-your-api-key-here"
```

**Azure App Service:**
- Go to Configuration → Application Settings
- Add `OpenAI__ApiKey` with your API key value

### 3. Verify Installation

1. Restore NuGet packages:
   ```bash
   cd service/EduPortal.Api
   dotnet restore
   ```

2. Build the project:
   ```bash
   dotnet build
   ```

3. Run the application:
   ```bash
   dotnet run
   ```

4. Test the evaluation endpoint:
   ```bash
   curl -X POST https://localhost:7xxx/api/assessments/evaluate \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "question": "What is polymorphism in OOP?",
       "expectedAnswer": "Polymorphism allows objects of different types to be treated through a common interface.",
       "studentAnswer": "It means objects can have different forms and be used in different ways.",
       "maxPoints": 10
     }'
   ```

## Cost Estimation

The system uses **GPT-4o-mini** for cost-effectiveness:

- **Model**: gpt-4o-mini
- **Cost**: ~$0.150 per 1M input tokens, ~$0.600 per 1M output tokens
- **Average per evaluation**: ~$0.0003 (500 input + 100 output tokens)
- **1000 evaluations**: ~$0.30

### Example Usage Costs

| Students | Assessments/Year | Questions/Assessment | Total Evaluations | Estimated Cost |
|----------|-----------------|---------------------|-------------------|----------------|
| 100      | 10              | 5                   | 5,000            | $1.50          |
| 500      | 20              | 8                   | 80,000           | $24.00         |
| 1000     | 30              | 10                  | 300,000          | $90.00         |

## Evaluation Process

### 1. Input Data

```typescript
{
  question: "Explain the concept of inheritance in OOP",
  expectedAnswer: "Inheritance allows a class to inherit properties...",
  studentAnswer: "It's when a child class gets features from parent...",
  maxPoints: 10
}
```

### 2. AI Prompt

The system sends a structured prompt to GPT-4o-mini:

```
Evaluate the following student answer for an undergraduate-level assessment.

QUESTION:
{question}

EXPECTED ANSWER (Reference):
{expectedAnswer}

STUDENT'S ANSWER:
{studentAnswer}

EVALUATION CRITERIA:
1. Correctness: Does the answer contain accurate information?
2. Completeness: Does it cover the main points?
3. Clarity: Is it well-explained?
4. Understanding: Does it demonstrate conceptual understanding?

SCORING:
Maximum Points: {maxPoints}
- Award full points if accurate, complete, and well-explained
- Deduct for missing concepts, inaccuracies, or unclear explanations
- Give partial credit for partially correct answers

RESPONSE FORMAT (JSON only):
{
    "score": <number 0 to maxPoints>,
    "feedback": "<brief constructive feedback>",
    "confidence": <0-1 decimal>
}
```

### 3. AI Response

```json
{
  "score": 8,
  "feedback": "Good understanding of inheritance concept. Answer correctly identifies parent-child relationship and feature transfer. Could be more precise with technical terminology.",
  "confidence": 0.85
}
```

### 4. Teacher Review

- Teacher sees AI-suggested score and feedback
- Can accept, modify, or completely override the score
- Final score is saved to database

## Fallback Mechanism

If OpenAI API is unavailable (no API key, network error, rate limit):

1. **Automatic Fallback**: Uses keyword matching algorithm
2. **Keyword Analysis**: Compares student answer with expected answer
3. **Scoring**: Based on percentage of key concepts mentioned
4. **Lower Confidence**: Fallback results have confidence ~0.6

### Fallback Algorithm

```csharp
// Extract key words (> 3 characters) from expected answer
var expectedWords = expectedAnswer.Split()
    .Where(w => w.Length > 3)
    .Distinct();

// Count matches in student answer
var matchPercentage = matchCount / expectedWords.Count;

// Calculate score
var score = (int)(matchPercentage * maxPoints);
```

## Security Considerations

### API Key Protection

1. **Never commit** API keys to version control
2. Add `appsettings.json` to `.gitignore` (if it contains keys)
3. Use **User Secrets** for development
4. Use **Environment Variables** for production
5. Rotate keys periodically

### Rate Limiting

The OpenAI client includes built-in rate limiting, but consider:

- Implementing request queuing for bulk evaluations
- Adding retry logic with exponential backoff
- Monitoring usage in OpenAI dashboard

### Data Privacy

- Student answers are sent to OpenAI for evaluation
- Ensure compliance with data protection regulations
- Consider on-premise alternatives if data privacy is critical

## Troubleshooting

### "OpenAI API key not configured" Warning

**Cause**: No API key found in configuration

**Solution**:
- Check `appsettings.json` has `"OpenAI": { "ApiKey": "..." }`
- Or set environment variable `OpenAI__ApiKey`
- System will use fallback keyword matching

### 401 Unauthorized from OpenAI

**Cause**: Invalid API key

**Solution**:
- Verify API key is correct (starts with `sk-proj-`)
- Check key hasn't been revoked in OpenAI dashboard
- Ensure no extra spaces or quotes in configuration

### 429 Rate Limit Exceeded

**Cause**: Too many requests to OpenAI API

**Solution**:
- Reduce concurrent evaluations
- Upgrade OpenAI plan for higher limits
- Implement request queuing/throttling

### Unexpected Scores

**Cause**: AI interpretation differs from expectations

**Solution**:
- Review and adjust prompts in `AiEvaluationService.cs`
- Provide more detailed expected answers
- Use teacher override to correct scores
- Consider fine-tuning prompts for your subject area

## Customization

### Adjusting Evaluation Criteria

Edit the prompt in `AiEvaluationService.cs`:

```csharp
private string BuildEvaluationPrompt(...)
{
    return $@"Evaluate the following student answer...
    
    EVALUATION CRITERIA:
    1. Technical Accuracy (40%)
    2. Completeness (30%)
    3. Examples Provided (20%)
    4. Code Quality (10%)
    
    // ... rest of prompt
    ";
}
```

### Using Different Models

Change the model in `EvaluateAnswerAsync`:

```csharp
var chatClient = _client.GetChatClient("gpt-4o"); // More powerful, more expensive
// or
var chatClient = _client.GetChatClient("gpt-3.5-turbo"); // Cheaper alternative
```

### Subject-Specific Prompts

Add course/subject context to prompts:

```csharp
var systemMessage = new SystemChatMessage(
    $"You are a {courseSubject} instructor evaluating undergraduate students."
);
```

## Research Scope

This implementation is designed for undergraduate research projects:

- ✅ Uses accessible, well-documented OpenAI API
- ✅ Includes fallback mechanism for reliability
- ✅ Cost-effective with GPT-4o-mini
- ✅ Simple prompt-based approach
- ✅ No complex ML training required
- ✅ Easy to modify and extend

### Future Enhancements

For advanced research:

1. **Fine-tuning**: Train custom models on historical grading data
2. **Ensemble Methods**: Combine multiple AI models
3. **Rubric Integration**: Parse and apply detailed rubrics
4. **Feedback Generation**: More detailed, personalized feedback
5. **Plagiarism Detection**: Integrate similarity checking
6. **Multi-language Support**: Evaluate answers in multiple languages

## Support

For issues or questions:

1. Check logs in `EduPortal.Api` output
2. Review OpenAI API status: https://status.openai.com/
3. Check OpenAI usage dashboard for quota/billing
4. Consult OpenAI documentation: https://platform.openai.com/docs

## References

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Pricing](https://openai.com/api/pricing/)
- [.NET OpenAI SDK](https://github.com/openai/openai-dotnet)
- [Best Practices for Prompt Engineering](https://platform.openai.com/docs/guides/prompt-engineering)
