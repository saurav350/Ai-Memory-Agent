using MemoryAgent.Api.Models;
using MemoryAgent.Api.Models.DTOs;

namespace MemoryAgent.Api.Services;

/// <summary>
/// Service interface for interacting with Google Gemini AI API.
/// </summary>
public interface IGeminiService
{
    /// <summary>
    /// Generates a summary and insights from a collection of memories using Google Gemini.
    /// </summary>
    /// <param name="memories">The list of memories to analyze.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>SummarizeResponseDto containing the AI summary.</returns>
    Task<SummarizeResponseDto> SummarizeMemoriesAsync(IReadOnlyList<Memory> memories, CancellationToken cancellationToken = default);
}
