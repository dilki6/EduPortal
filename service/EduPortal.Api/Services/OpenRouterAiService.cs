using System.Text;
using System.Text.Json;

namespace EduPortal.Api.Services;

/// <summary>
/// OpenRouter AI Service for answer evaluation using Qwen models
/// This service uses the OpenRouter API instead of local Ollama
/// </summary>
public class OpenRouterAiService : IAiEvaluationService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OpenRouterAiService> _logger;
    private readonly string _apiUrl;
    private readonly string _apiKey;
    private readonly string _llmModel;
    private readonly bool _isConfigured;

    public OpenRouterAiService(
        IConfiguration configuration,
        ILogger<OpenRouterAiService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();

        _apiUrl = _configuration["OpenRouter:ApiUrl"] ?? "https://openrouter.ai/api/v1";
        _apiKey = _configuration["OpenRouter:ApiKey"] ?? string.Empty;
        _llmModel = _configuration["OpenRouter:LlmModel"] ?? "qwen/qwen-vl-max";
        
        _isConfigured = !string.IsNullOrWhiteSpace(_apiKey) && _apiKey != "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";

        if (!_isConfigured)
        {
            _logger.LogWarning("OpenRouter API Key not configured. AI evaluation will use fallback method.");
        }
        else
        {
            _logger.LogInformation("OpenRouter configured successfully. Using model: {Model}", _llmModel);
        }
    }

    /// <summary>
    /// Evaluates student answers using OpenRouter API (Qwen model)
    /// Falls back to keyword matching if API is not available
    /// </summary>
    public async Task<AiEvaluationResult> EvaluateAnswerAsync(
        string question,
        string expectedAnswer,
        string studentAnswer,
        int maxPoints)
    {
        if (!_isConfigured)
        {
            _logger.LogInformation("Using fallback evaluation method (keyword matching)");
            return EvaluateWithKeywordMatching(expectedAnswer, studentAnswer, maxPoints);
        }

        try
        {
            // Build the evaluation prompt
            var prompt = BuildEvaluationPrompt(question, expectedAnswer, studentAnswer, maxPoints);

            // Create request for OpenRouter API
            var requestBody = new
            {
                model = _llmModel,
                messages = new[]
                {
                    new
                    {
                        role = "system",
                        content = "You are an expert educational assessment evaluator. Provide a numerical score and constructive feedback."
                    },
                    new
                    {
                        role = "user",
                        content = prompt
                    }
                },
                temperature = 0.3,
                max_tokens = 500
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            // Add authorization header
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");

            _logger.LogInformation("Sending request to OpenRouter API for answer evaluation");

            // Send request to OpenRouter
            var response = await _httpClient.PostAsync(
                $"{_apiUrl}/chat/completions",
                content
            );

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError(
                    "OpenRouter API error ({StatusCode}): {ErrorContent}",
                    response.StatusCode,
                    errorContent
                );
                throw new Exception($"OpenRouter API error: {response.StatusCode}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("OpenRouter response: {Response}", responseContent);

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var openRouterResponse = JsonSerializer.Deserialize<OpenRouterResponse>(
                responseContent,
                options
            );

            if (openRouterResponse?.Choices == null || openRouterResponse.Choices.Count == 0)
            {
                throw new Exception("Invalid response from OpenRouter API");
            }

            var aiResponse = openRouterResponse.Choices[0].Message.Content;
            _logger.LogInformation("OpenRouter AI response: {AiResponse}", aiResponse);

            return ParseAiResponse(aiResponse, maxPoints);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error calling OpenRouter API. Falling back to keyword matching. Details: {Message}",
                ex.Message
            );
            return EvaluateWithKeywordMatching(expectedAnswer, studentAnswer, maxPoints);
        }
    }

    /// <summary>
    /// Builds a detailed prompt for the AI model to evaluate the answer
    /// </summary>
    private string BuildEvaluationPrompt(
        string question,
        string expectedAnswer,
        string studentAnswer,
        int maxPoints)
    {
        return $"""
            Please evaluate the following student's answer to an educational question.

            QUESTION:
            {question}

            EXPECTED/MODEL ANSWER:
            {expectedAnswer}

            STUDENT'S ANSWER:
            {studentAnswer}

            EVALUATION CRITERIA:
            - Maximum points available: {maxPoints}
            - Assess based on accuracy, completeness, and understanding
            - Consider partial credit for partially correct answers
            - Provide constructive feedback

            Please respond in the following format:
            SCORE: [number from 0 to {maxPoints}]
            FEEDBACK: [brief constructive feedback]
            CONFIDENCE: [0.0 to 1.0]

            Example:
            SCORE: 8
            FEEDBACK: Good understanding of the concept, but missing some details about implementation.
            CONFIDENCE: 0.85
            """;
    }

    /// <summary>
    /// Parses the AI response to extract score, feedback, and confidence
    /// </summary>
    private AiEvaluationResult ParseAiResponse(string aiResponse, int maxPoints)
    {
        try
        {
            var lines = aiResponse.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            var result = new AiEvaluationResult
            {
                SuggestedScore = 0,
                Feedback = aiResponse,
                Confidence = 0.7
            };

            foreach (var line in lines)
            {
                if (line.StartsWith("SCORE:", StringComparison.OrdinalIgnoreCase))
                {
                    var scoreText = line.Replace("SCORE:", "", StringComparison.OrdinalIgnoreCase).Trim();
                    if (int.TryParse(scoreText, out var score))
                    {
                        result.SuggestedScore = Math.Min(score, maxPoints);
                    }
                }
                else if (line.StartsWith("FEEDBACK:", StringComparison.OrdinalIgnoreCase))
                {
                    result.Feedback = line.Replace("FEEDBACK:", "", StringComparison.OrdinalIgnoreCase).Trim();
                }
                else if (line.StartsWith("CONFIDENCE:", StringComparison.OrdinalIgnoreCase))
                {
                    var confText = line.Replace("CONFIDENCE:", "", StringComparison.OrdinalIgnoreCase).Trim();
                    if (double.TryParse(confText, out var confidence))
                    {
                        result.Confidence = Math.Clamp(confidence, 0, 1);
                    }
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing AI response: {Response}", aiResponse);
            return new AiEvaluationResult
            {
                SuggestedScore = 0,
                Feedback = aiResponse,
                Confidence = 0.5
            };
        }
    }

    /// <summary>
    /// Fallback keyword matching evaluation method
    /// </summary>
    private AiEvaluationResult EvaluateWithKeywordMatching(
        string expectedAnswer,
        string studentAnswer,
        int maxPoints)
    {
        if (string.IsNullOrWhiteSpace(studentAnswer) || string.IsNullOrWhiteSpace(expectedAnswer))
        {
            return new AiEvaluationResult
            {
                SuggestedScore = 0,
                Feedback = "Answer is empty or missing.",
                Confidence = 1.0
            };
        }

        var expectedWords = expectedAnswer.ToLower()
            .Split(new[] { ' ', '.', ',', ';', ':', '!', '?' }, StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 3)
            .Distinct()
            .ToList();

        var studentWords = studentAnswer.ToLower()
            .Split(new[] { ' ', '.', ',', ';', ':', '!', '?' }, StringSplitOptions.RemoveEmptyEntries)
            .ToList();

        var matchCount = expectedWords.Count(word =>
            studentWords.Any(sw => sw.Contains(word) || word.Contains(sw))
        );

        var matchPercentage = expectedWords.Count > 0
            ? (double)matchCount / expectedWords.Count
            : 0;

        var score = (int)Math.Round(matchPercentage * maxPoints);

        var feedback = matchPercentage switch
        {
            >= 0.9 => "Excellent answer covering most key concepts.",
            >= 0.7 => "Good answer, but some key points could be expanded.",
            >= 0.5 => "Partial answer. Missing some important concepts.",
            >= 0.3 => "Limited answer. Please include more key concepts.",
            _ => "Answer needs significant improvement. Review the material."
        };

        return new AiEvaluationResult
        {
            SuggestedScore = score,
            Feedback = feedback,
            Confidence = 0.6
        };
    }

    // OpenRouter API Response Models
    private class OpenRouterResponse
    {
        public List<Choice> Choices { get; set; } = new();
    }

    private class Choice
    {
        public Message Message { get; set; } = new();
    }

    private class Message
    {
        public string Content { get; set; } = string.Empty;
    }
}
