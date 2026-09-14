using System.Text;
using System.Text.Json;
using MemoryAgent.Api.Models;
using MemoryAgent.Api.Models.DTOs;

namespace MemoryAgent.Api.Services;

/// <summary>
/// Implementation of Gemini AI service for memory summarization.
/// Calls Google Gemini API (gemini-1.5-flash) via HttpClient.
/// </summary>
public class GeminiService : IGeminiService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GeminiService> _logger;

    public GeminiService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GeminiService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<SummarizeResponseDto> SummarizeMemoriesAsync(
        IReadOnlyList<Memory> memories,
        CancellationToken cancellationToken = default)
    {
        if (memories == null || memories.Count == 0)
        {
            return new SummarizeResponseDto
            {
                Summary = "No memories stored yet. Add some memories first to generate AI insights!",
                MemoriesAnalyzed = 0,
                IsAiGenerated = false,
                Notice = "Database has 0 memory records."
            };
        }

        // Retrieve API key from configuration (appsettings.json or GEMINI_API_KEY environment variable)
        var apiKey = _configuration["Gemini:ApiKey"]
                     ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");

        var model = _configuration["Gemini:Model"] ?? "gemini-1.5-flash";

        // Check if API key is not configured or still has placeholder
        if (string.IsNullOrWhiteSpace(apiKey) || apiKey.Equals("YOUR_GEMINI_API_KEY_HERE", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Gemini API key is not configured or using default placeholder.");
            return GenerateSimulatedSummary(memories, "Gemini API key is not configured. To enable live Google Gemini AI insights, add your free key to 'Gemini:ApiKey' in appsettings.json or set the GEMINI_API_KEY environment variable (visit https://aistudio.google.com).");
        }

        try
        {
            // Build the prompt containing memories formatted with timestamps and categories
            var promptBuilder = new StringBuilder();
            promptBuilder.AppendLine("You are an AI Memory Agent and personal knowledge assistant. Analyze the user's stored memories below.");
            promptBuilder.AppendLine("Provide a well-structured response in clean markdown with the following sections:");
            promptBuilder.AppendLine("1. **Executive Summary**: A concise synthesis of what the user has stored.");
            promptBuilder.AppendLine("2. **Category & Theme Breakdown**: Key patterns across different categories (work, personal, ideas, etc.).");
            promptBuilder.AppendLine("3. **Actionable Insights & Reflections**: 2-3 thoughtful suggestions, connections, or reminders based on these memories.");
            promptBuilder.AppendLine();
            promptBuilder.AppendLine("--- MEMORIES LIST ---");

            foreach (var memory in memories)
            {
                promptBuilder.AppendLine($"- [Category: {memory.Category}] (Date: {memory.CreatedAt:yyyy-MM-dd HH:mm}) : {memory.Content}");
            }

            promptBuilder.AppendLine("--- END OF MEMORIES ---");

            // Google Gemini generateContent payload
            var requestPayload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = promptBuilder.ToString() }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.7,
                    maxOutputTokens = 800
                }
            };

            var jsonContent = new StringContent(
                JsonSerializer.Serialize(requestPayload),
                Encoding.UTF8,
                "application/json"
            );

            // Candidate models: configured model first, followed by active Gemini flash alternatives
            var candidateModels = new[] { model, "gemini-flash-latest", "gemini-2.5-flash", "gemini-3.6-flash" }.Distinct();
            HttpResponseMessage? response = null;
            string lastErrorBody = string.Empty;

            foreach (var candidateModel in candidateModels)
            {
                var requestUrl = $"https://generativelanguage.googleapis.com/v1beta/models/{candidateModel}:generateContent?key={apiKey}";
                response = await _httpClient.PostAsync(requestUrl, jsonContent, cancellationToken);

                if (response.IsSuccessStatusCode)
                {
                    break;
                }

                lastErrorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Gemini API call with model '{Model}' failed with status {StatusCode}. Trying next candidate if available.", candidateModel, response.StatusCode);
            }

            if (response == null || !response.IsSuccessStatusCode)
            {
                _logger.LogError("All Gemini model candidates failed. Last response: {Error}", lastErrorBody);
                return GenerateSimulatedSummary(
                    memories,
                    $"Gemini API returned HTTP {(int)(response?.StatusCode ?? System.Net.HttpStatusCode.InternalServerError)}. Check API key and quota."
                );
            }

            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            // Parse response JSON from Gemini API
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            if (root.TryGetProperty("candidates", out var candidates) &&
                candidates.GetArrayLength() > 0 &&
                candidates[0].TryGetProperty("content", out var content) &&
                content.TryGetProperty("parts", out var parts) &&
                parts.GetArrayLength() > 0 &&
                parts[0].TryGetProperty("text", out var textElement))
            {
                var generatedText = textElement.GetString() ?? string.Empty;

                return new SummarizeResponseDto
                {
                    Summary = generatedText,
                    MemoriesAnalyzed = memories.Count,
                    GeneratedAt = DateTime.UtcNow,
                    IsAiGenerated = true
                };
            }

            return GenerateSimulatedSummary(memories, "Unable to extract response text from Gemini API response structure.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while calling Gemini API.");
            return GenerateSimulatedSummary(memories, $"An error occurred contacting Gemini API: {ex.Message}");
        }
    }

    /// <summary>
    /// Fallback summary generator for offline testing or when API key is missing.
    /// Ensures frontend and tests always receive structured data and clear guidance.
    /// </summary>
    private static SummarizeResponseDto GenerateSimulatedSummary(IReadOnlyList<Memory> memories, string notice)
    {
        var categoryGroups = memories.GroupBy(m => m.Category).ToList();
        var sb = new StringBuilder();

        sb.AppendLine("### 🤖 Local AI Memory Synthesis");
        sb.AppendLine();
        sb.AppendLine($"You currently have **{memories.Count}** memory records across **{categoryGroups.Count}** categories.");
        sb.AppendLine();
        sb.AppendLine("#### 📊 Category Breakdown");
        foreach (var group in categoryGroups)
        {
            sb.AppendLine($"- **{group.Key}**: {group.Count()} note(s)");
        }
        sb.AppendLine();
        sb.AppendLine("#### 💡 Recent Notes Highlighted");
        foreach (var recent in memories.Take(3))
        {
            sb.AppendLine($"- [{recent.Category}] *\"{recent.Content}\"*");
        }
        sb.AppendLine();
        sb.AppendLine("#### 📌 Key Observation");
        sb.AppendLine("Your memories reflect ongoing thoughts and tasks. Add more details and configure your Gemini API key to unlock full natural-language synthesis!");

        return new SummarizeResponseDto
        {
            Summary = sb.ToString(),
            MemoriesAnalyzed = memories.Count,
            GeneratedAt = DateTime.UtcNow,
            IsAiGenerated = false,
            Notice = notice
        };
    }
}
