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
        _llmModel = _configuration["OpenRouter:LlmModel"] ?? "qwen/qwen-2.5-7b-instruct";
        
        _isConfigured = !string.IsNullOrWhiteSpace(_apiKey) && _apiKey != "${OPENROUTER_API_KEY}";

        _logger.LogInformation("[OpenRouterAiService] Constructor initialized");
        _logger.LogInformation("[OpenRouterAiService] API URL: {Url}", _apiUrl);
        _logger.LogInformation("[OpenRouterAiService] Model: {Model}", _llmModel);
        _logger.LogInformation("[OpenRouterAiService] API Key configured: {IsConfigured}", _isConfigured);

        if (!_isConfigured)
        {
            _logger.LogWarning("[OpenRouterAiService] ⚠️ API Key is NOT configured properly. Will throw error on evaluation.");
        }
        else
        {
            _logger.LogInformation("[OpenRouterAiService] ✓ Ready to evaluate answers using OpenRouter API");
        }
    }

    /// <summary>
    /// Evaluates student answers using OpenRouter API (Qwen model) ONLY
    /// No fallback - uses only the configured OpenRouter API
    /// </summary>
    public async Task<AiEvaluationResult> EvaluateAnswerAsync(
        string question,
        string expectedAnswer,
        string studentAnswer,
        int maxPoints)
    {
        _logger.LogInformation("EvaluateAnswerAsync called. Configured: {IsConfigured}", _isConfigured);
        
        if (!_isConfigured)
        {
            throw new InvalidOperationException("OpenRouter API Key is not configured. Cannot evaluate answers.");
        }

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
                    role = "user",
                    content = prompt
                }
            },
            temperature = 0.3,
            max_tokens = 500
        };

        var jsonContent = JsonSerializer.Serialize(requestBody);
        _logger.LogInformation("Calling OpenRouter API at {Url} with model {Model}", _apiUrl, _llmModel);
        
        var content = new StringContent(
            jsonContent,
            Encoding.UTF8,
            "application/json"
        );

        // Add authorization header
        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");

        _logger.LogInformation("Sending request to OpenRouter API");

        // Send request to OpenRouter
        var response = await _httpClient.PostAsync(
            $"{_apiUrl}/chat/completions",
            content
        );

        _logger.LogInformation("OpenRouter API response status: {StatusCode}", response.StatusCode);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            _logger.LogError(
                "OpenRouter API error ({StatusCode}): {ErrorContent}",
                response.StatusCode,
                errorContent
            );
            throw new HttpRequestException($"OpenRouter API error: {response.StatusCode} - {errorContent}");
        }

        var responseContent = await response.Content.ReadAsStringAsync();
        _logger.LogInformation("OpenRouter API response received successfully");

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var openRouterResponse = JsonSerializer.Deserialize<OpenRouterResponse>(
            responseContent,
            options
        );

        if (openRouterResponse?.Choices == null || openRouterResponse.Choices.Count == 0)
        {
            throw new InvalidOperationException("Invalid response from OpenRouter API: No choices returned");
        }

        var aiResponse = openRouterResponse.Choices[0].Message.Content;
        _logger.LogInformation("OpenRouter API evaluation complete");

        return ParseAiResponse(aiResponse, maxPoints);
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
