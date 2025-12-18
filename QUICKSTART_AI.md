# Quick Start: AI Evaluation

## 1. Get OpenAI API Key (2 minutes)

1. Visit https://platform.openai.com/
2. Sign up/login
3. Go to API Keys section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-proj-...`)

## 2. Configure API Key (30 seconds)

### Windows (PowerShell):
```powershell
cd service\EduPortal.Api
dotnet user-secrets set "OpenAI:ApiKey" "sk-proj-your-key-here"
```

### Linux/macOS:
```bash
cd service/EduPortal.Api
dotnet user-secrets set "OpenAI:ApiKey" "sk-proj-your-key-here"
```

### Alternative (Environment Variable):
```powershell
$env:OpenAI__ApiKey = "sk-proj-your-key-here"
```

## 3. Restart Application

```bash
cd service
# Windows:
start.bat

# Linux/macOS:
./start.sh
```

## 4. Test It Out

1. Login as Teacher
2. Go to any assessment with student attempts
3. Click "Review Answers" for a student
4. Click "Evaluate with AI" on essay/short answer questions
5. See AI-suggested score and feedback!

## Without API Key?

No problem! The system automatically falls back to keyword matching. Perfect for:
- Testing/development
- Demonstrations
- Budget-constrained use

## Cost

- **Per evaluation**: ~$0.0003
- **1,000 evaluations**: ~$0.30
- **One semester (5,000 evals)**: ~$1.50

## Files Modified

### Backend
- `Services/AiEvaluationService.cs` - NEW
- `Controllers/AssessmentsController.cs` - Added evaluate endpoint
- `DTOs/AssessmentDTOs.cs` - Added EvaluateAnswerRequest
- `Program.cs` - Registered AI service
- `appsettings.json` - Added OpenAI config section
- `EduPortal.Api.csproj` - Added OpenAI package

### Frontend
- `lib/api.ts` - Added evaluateAnswer method
- `pages/ReviewAnswers.tsx` - Updated to call real API

### Documentation
- `AI_EVALUATION_SETUP.md` - Full setup guide
- `AI_IMPLEMENTATION_SUMMARY.md` - Implementation overview

## Troubleshooting

### "OpenAI API key not configured" warning in logs
- System is using keyword matching fallback
- Add API key to enable AI evaluation

### Build errors
- Make sure application is stopped before building
- Run `dotnet restore` in EduPortal.Api folder

### API returns errors
- Check OpenAI status: https://status.openai.com/
- Verify API key is correct
- Check usage limits in OpenAI dashboard

## More Info

See `AI_EVALUATION_SETUP.md` for comprehensive documentation.
