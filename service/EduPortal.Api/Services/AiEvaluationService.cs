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

    /// <summary>
    /// ╔═══════════════════════════════════════════════════════════════════════╗
    /// ║          CHECKS OLLAMA SERVICE AVAILABILITY                         ║
    /// ╚═══════════════════════════════════════════════════════════════════════╝
    /// 
    /// Purpose: Verifies if the Ollama AI service is accessible and running
    /// at the configured URL endpoint.
    /// 
    /// How it works:
    ///   • Sends a GET request to the Ollama /api/tags endpoint
    ///   • Returns true if Ollama is available (HTTP 2xx status)
    ///   • Returns false if connection fails or service is down
    /// 
    /// Returns: 
    ///   Task&lt;bool&gt; - True if Ollama is available, false otherwise
    /// </summary>
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

    /// <summary>
    /// ╔═══════════════════════════════════════════════════════════════════════╗
    /// ║   MAIN EVALUATION ENGINE - AI-POWERED ANSWER GRADING               ║
    /// ╚═══════════════════════════════════════════════════════════════════════╝
    /// 
    /// Purpose: Intelligently evaluates student answers using either
    /// Ollama AI (if available) or keyword matching fallback.
    /// 
    /// Parameters:
    ///   • question: The assessment question being answered
    ///   • expectedAnswer: The reference/correct answer
    ///   • studentAnswer: The student's submitted answer
    ///   • maxPoints: Maximum points available for this question
    /// 
    /// Process Flow:
    ///   1. Checks if Ollama AI service is configured
    ///   2. If available → Uses AI to evaluate with nuanced scoring
    ///   3. If unavailable → Falls back to keyword matching
    ///   4. Includes error handling and logging
    /// 
    /// Returns: 
    ///   Task&lt;AiEvaluationResult&gt; containing:
    ///     • SuggestedScore: Points awarded (0 to maxPoints)
    ///     • Feedback: Constructive feedback for the student
    ///     • Confidence: Confidence level of the evaluation (0-1)
    /// </summary>
    public async Task<AiEvaluationResult> EvaluateAnswerAsync(
        string question, 
        string expectedAnswer, 
        string studentAnswer, 
        int maxPoints)
    {
        // ✓ CHECK: If Ollama is not available, use simple keyword matching as fallback
        if (!_isConfigured)
        {
            _logger.LogInformation("Using fallback evaluation method (keyword matching)");
            return EvaluateWithKeywordMatching(expectedAnswer, studentAnswer, maxPoints);
        }

        try
        {
            // ✓ STEP 1: Build evaluation prompt with question, answers, and criteria
            var prompt = BuildEvaluationPrompt(question, expectedAnswer, studentAnswer, maxPoints);
            
            // ✓ STEP 2: Construct request body for Ollama API
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

            // ✓ STEP 3: Serialize request body to JSON content
            var content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            // ✓ STEP 4: Send POST request to Ollama API endpoint
            var response = await _httpClient.PostAsync($"{_ollamaUrl}/api/generate", content);
            response.EnsureSuccessStatusCode();

            // ✓ STEP 5: Read and log raw response content from Ollama
            var responseContent = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Ollama raw response: {Response}", responseContent);

            // ✓ STEP 6: Configure JSON deserialization options for flexibility
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            
            // ✓ STEP 7: Deserialize Ollama response into structured object
            var ollamaResponse = JsonSerializer.Deserialize<OllamaResponse>(responseContent, options);

            // ✓ STEP 8: Validate that response contains actual AI evaluation text
            if (ollamaResponse?.Response == null)
            {
                _logger.LogError("Ollama response was null or empty. Full response: {Response}", responseContent);
                throw new Exception($"Invalid response from Ollama: {responseContent}");
            }

            // ✓ STEP 9: Log the AI response and parse it into evaluation result
            _logger.LogInformation("Ollama AI response text: {AiResponse}", ollamaResponse.Response);
            return ParseAiResponse(ollamaResponse.Response, maxPoints);
        }
        catch (Exception ex)
        {
            // ✗ FALLBACK: On any error, fall back to keyword matching evaluation
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

    /// <summary>
    /// ╔═══════════════════════════════════════════════════════════════════════╗
    /// ║          CONSTRUCTS AI EVALUATION PROMPT                             ║
    /// ╚═══════════════════════════════════════════════════════════════════════╝
    /// 
    /// Purpose: Creates a detailed, structured prompt to send to Ollama
    /// that guides the AI to evaluate student answers consistently.
    /// 
    /// Parameters:
    ///   • question: The question being evaluated
    ///   • expectedAnswer: Reference answer for comparison
    ///   • studentAnswer: The student's response to evaluate
    ///   • maxPoints: Total points for grading context
    /// 
    /// Prompt Structure:
    ///   ├─ Role Definition: Sets AI context as educational assessor
    ///   ├─ Question/Answer Sections: Provides all evaluation inputs
    ///   ├─ Evaluation Criteria: Defines scoring dimensions
    ///   │   (Correctness, Completeness, Clarity, Understanding)
    ///   ├─ Scoring Guidelines: Instructs partial credit rules
    ///   └─ Response Format: Forces JSON output for reliable parsing
    /// 
    /// Returns: 
    ///   string - Complete prompt ready for Ollama API submission
    /// </summary>
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

    /// <summary>
    /// ╔═══════════════════════════════════════════════════════════════════════╗
    /// ║          PARSES AND VALIDATES AI RESPONSE                            ║
    /// ╚═══════════════════════════════════════════════════════════════════════╝
    /// 
    /// Purpose: Extracts and validates JSON data from Ollama's response,
    /// handling various formatting issues and edge cases.
    /// 
    /// Parameters:
    ///   • response: Raw text response from Ollama AI
    ///   • maxPoints: Maximum score for validation and bounding
    /// 
    /// Processing Steps:
    ///   1. Clean Response:
    ///      • Removes markdown code blocks (```json, ```)
    ///      • Trims whitespace
    ///   2. Parse JSON:
    ///      • Deserializes cleaned response
    ///      • Handles various JSON variations
    ///   3. Extract Fields:
    ///      • Score: Student's earned points
    ///      • Feedback: Explanatory text for the student
    ///      • Confidence: AI's confidence in its evaluation (0-1)
    ///   4. Validate &amp; Bound:
    ///      • Ensures score is between 0 and maxPoints
    ///      • Ensures confidence is between 0 and 1
    /// 
    /// Returns: 
    ///   AiEvaluationResult - Validated evaluation with safe defaults
    ///   on any parsing error
    /// </summary>
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

    /// <summary>
    /// ╔═══════════════════════════════════════════════════════════════════════╗
    /// ║          FALLBACK EVALUATION: KEYWORD MATCHING                       ║
    /// ╚═══════════════════════════════════════════════════════════════════════╝
    /// 
    /// Purpose: Provides a lightweight fallback grading method when
    /// Ollama AI is unavailable. Compares answer keywords statistically.
    /// 
    /// Parameters:
    ///   • expectedAnswer: Reference answer containing key concepts
    ///   • studentAnswer: Student's submitted response
    ///   • maxPoints: Maximum points for scaling the score
    /// 
    /// Evaluation Algorithm:
    ///   1. Parse Both Answers:
    ///      • Extract words &gt; 3 characters
    ///      • Remove common delimiters and whitespace
    ///   2. Match Keywords:
    ///      • Count expected keywords found in student answer
    ///      • Calculate match percentage
    ///   3. Score &amp; Feedback:
    ///      ├─ 90%+ : "Excellent" - Full or near-full credit
    ///      ├─ 70-89%: "Good" - Most concepts covered
    ///      ├─ 50-69%: "Partial" - Key concepts missing
    ///      ├─ 30-49%: "Limited" - Significant gaps
    ///      └─ &lt;30%: "Needs Work" - Major improvement needed
    /// 
    /// Returns: 
    ///   AiEvaluationResult - Simple but effective scoring with
    ///   0.6 confidence level (lower than AI-based evaluation)
    /// </summary>
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
