using System.Text;
using System.Text.Json;

namespace EduPortal.Api.Services;

public interface IAiEvaluationService
{
    Task<AiEvaluationResult> EvaluateAnswerAsync(string question, string expectedAnswer, string studentAnswer, int maxPoints);
}

public class AiEvaluationResult
{
    public int SuggestedScore { get; set; }
    public string Feedback { get; set; } = string.Empty;
    public double Confidence { get; set; } // 0-1 scale
}

public class AiEvaluationService : IAiEvaluationService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiEvaluationService> _logger;
    private readonly string _ollamaUrl;
    private readonly string _model;
    private readonly bool _isConfigured;

    public AiEvaluationService(IConfiguration configuration, ILogger<AiEvaluationService> logger, IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
        
        _ollamaUrl = _configuration["Ollama:Url"] ?? "http://localhost:11434";
        _model = _configuration["Ollama:Model"] ?? "qwen2.5:3b"; // Best small model for instruction following
        
        _isConfigured = CheckOllamaAvailability().GetAwaiter().GetResult();
        
        if (!_isConfigured)
        {
            _logger.LogWarning("Ollama not available at {Url}. AI evaluation will use fallback method.", _ollamaUrl);
        }
        else
        {
            _logger.LogInformation("Ollama configured successfully. Using model: {Model}", _model);
        }
    }

    private async Task<bool> CheckOllamaAvailability()
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_ollamaUrl}/api/tags");
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to connect to Ollama at {Url}", _ollamaUrl);
            return false;
        }
    }

    public async Task<AiEvaluationResult> EvaluateAnswerAsync(
        string question, 
        string expectedAnswer, 
        string studentAnswer, 
        int maxPoints)
    {
        // If Ollama is not available, use simple keyword matching as fallback
        if (!_isConfigured)
        {
            _logger.LogInformation("Using fallback evaluation method (keyword matching)");
            return EvaluateWithKeywordMatching(expectedAnswer, studentAnswer, maxPoints);
        }

        try
        {
            var prompt = BuildEvaluationPrompt(question, expectedAnswer, studentAnswer, maxPoints);
            
            var requestBody = new
            {
                model = _model,
                prompt = prompt,
                stream = false,
                options = new
                {
                    temperature = 0.3, // Lower temperature for more consistent grading
                    num_predict = 300  // Limit response length
                }
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync($"{_ollamaUrl}/api/generate", content);
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Ollama raw response: {Response}", responseContent);

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            
            var ollamaResponse = JsonSerializer.Deserialize<OllamaResponse>(responseContent, options);

            if (ollamaResponse?.Response == null)
            {
                _logger.LogError("Ollama response was null or empty. Full response: {Response}", responseContent);
                throw new Exception($"Invalid response from Ollama: {responseContent}");
            }

            _logger.LogInformation("Ollama AI response text: {AiResponse}", ollamaResponse.Response);
            return ParseAiResponse(ollamaResponse.Response, maxPoints);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Ollama API. Falling back to keyword matching. Details: {Message}", ex.Message);
            return EvaluateWithKeywordMatching(expectedAnswer, studentAnswer, maxPoints);
        }
    }

    private class OllamaResponse
    {
        [System.Text.Json.Serialization.JsonPropertyName("response")]
        public string? Response { get; set; }
        
        [System.Text.Json.Serialization.JsonPropertyName("done")]
        public bool Done { get; set; }
        
        [System.Text.Json.Serialization.JsonPropertyName("model")]
        public string? Model { get; set; }
    }

    private string BuildEvaluationPrompt(string question, string expectedAnswer, string studentAnswer, int maxPoints)
    {
        return $@"You are an educational assessment assistant. Evaluate the student's answer fairly and provide constructive feedback.

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
- Award full points if the answer is accurate, complete, and well-explained
- Deduct points for missing key concepts, inaccuracies, or unclear explanations
- Give partial credit for partially correct answers

RESPONSE FORMAT (you must respond with ONLY valid JSON, no other text):
{{
    ""score"": <number between 0 and {maxPoints}>,
    ""feedback"": ""<brief constructive feedback explaining the score>"",
    ""confidence"": <decimal between 0 and 1 indicating confidence>
}}

Respond with ONLY the JSON object, nothing else.";
    }

    private AiEvaluationResult ParseAiResponse(string response, int maxPoints)
    {
        try
        {
            _logger.LogInformation("Parsing AI response. Raw length: {Length}", response.Length);
            
            // Clean the response (remove markdown code blocks if present)
            var cleanResponse = response.Trim();
            
            // Remove various markdown code block formats
            if (cleanResponse.StartsWith("```json"))
            {
                cleanResponse = cleanResponse.Substring(7);
            }
            else if (cleanResponse.StartsWith("```"))
            {
                cleanResponse = cleanResponse.Substring(3);
            }
            
            if (cleanResponse.EndsWith("```"))
            {
                cleanResponse = cleanResponse.Substring(0, cleanResponse.Length - 3);
            }
            cleanResponse = cleanResponse.Trim();

            _logger.LogInformation("Cleaned response for parsing: {Clean}", cleanResponse);

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                AllowTrailingCommas = true
            };

            var result = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(cleanResponse, options);
            
            if (result == null)
            {
                throw new Exception("Failed to parse AI response as JSON");
            }

            // Parse score
            int score;
            if (result.ContainsKey("score"))
            {
                if (result["score"].ValueKind == JsonValueKind.Number)
                {
                    score = result["score"].GetInt32();
                }
                else
                {
                    score = int.Parse(result["score"].GetString() ?? "0");
                }
            }
            else
            {
                throw new Exception("Response missing 'score' field");
            }

            // Parse feedback
            string feedback = "No feedback provided";
            if (result.ContainsKey("feedback"))
            {
                feedback = result["feedback"].GetString() ?? feedback;
            }

            // Parse confidence
            double confidence = 0.8;
            if (result.ContainsKey("confidence"))
            {
                if (result["confidence"].ValueKind == JsonValueKind.Number)
                {
                    confidence = result["confidence"].GetDouble();
                }
                else
                {
                    double.TryParse(result["confidence"].GetString(), out confidence);
                }
            }

            // Validate score is within range
            score = Math.Max(0, Math.Min(maxPoints, score));
            confidence = Math.Max(0, Math.Min(1, confidence));

            _logger.LogInformation("Successfully parsed: Score={Score}/{Max}, Confidence={Conf}", score, maxPoints, confidence);

            return new AiEvaluationResult
            {
                SuggestedScore = score,
                Feedback = feedback,
                Confidence = confidence
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse AI response: {Response}", response);
            
            // Return a safe default
            return new AiEvaluationResult
            {
                SuggestedScore = maxPoints / 2,
                Feedback = $"Unable to automatically evaluate. Please review manually. (Parse error: {ex.Message})",
                Confidence = 0.3
            };
        }
    }

    private AiEvaluationResult EvaluateWithKeywordMatching(string expectedAnswer, string studentAnswer, int maxPoints)
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
}
