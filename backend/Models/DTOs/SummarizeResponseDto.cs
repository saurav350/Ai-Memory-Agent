namespace MemoryAgent.Api.Models.DTOs;

/// <summary>
/// Data transfer object returned by the /api/memories/summarize endpoint.
/// </summary>
public class SummarizeResponseDto
{
    public string Summary { get; set; } = string.Empty;
    public int MemoriesAnalyzed { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public bool IsAiGenerated { get; set; } = true;
    public string? Notice { get; set; }
}
