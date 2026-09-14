using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoryAgent.Api.Data;
using MemoryAgent.Api.Models;
using MemoryAgent.Api.Models.DTOs;
using MemoryAgent.Api.Services;

namespace MemoryAgent.Api.Controllers;

/// <summary>
/// Controller for managing user memories and generating AI summaries.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class MemoriesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IGeminiService _geminiService;
    private readonly ILogger<MemoriesController> _logger;

    public MemoriesController(
        AppDbContext context,
        IGeminiService geminiService,
        ILogger<MemoriesController> logger)
    {
        _context = context;
        _geminiService = geminiService;
        _logger = logger;
    }

    /// <summary>
    /// GET: /api/memories
    /// Retrieves all memories, ordered with the newest first. Optionally filter by category.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Memory>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<Memory>>> GetAll([FromQuery] string? category = null)
    {
        try
        {
            IQueryable<Memory> query = _context.Memories.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(category))
            {
                query = query.Where(m => m.Category.ToLower() == category.Trim().ToLower());
            }

            var memories = await query
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();

            return Ok(memories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch memories from MySQL database.");
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = "Database connection error. Please ensure MySQL is running and your connection string in appsettings.json has the correct user and password.",
                details = ex.Message
            });
        }
    }

    /// <summary>
    /// GET: /api/memories/{id}
    /// Retrieves a single memory by its unique ID.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(Memory), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Memory>> GetById(int id)
    {
        var memory = await _context.Memories.FindAsync(id);

        if (memory == null)
        {
            _logger.LogInformation("Memory with ID {Id} was not found.", id);
            return NotFound(new { message = $"Memory with ID {id} was not found." });
        }

        return Ok(memory);
    }

    /// <summary>
    /// POST: /api/memories
    /// Creates a new memory.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Memory), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Memory>> Create([FromBody] CreateMemoryDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var memory = new Memory
        {
            Content = dto.Content.Trim(),
            Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _context.Memories.AddAsync(memory);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created new memory with ID {Id} in category {Category}", memory.Id, memory.Category);

        return CreatedAtAction(nameof(GetById), new { id = memory.Id }, memory);
    }

    /// <summary>
    /// DELETE: /api/memories/{id}
    /// Deletes a memory by its ID.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var memory = await _context.Memories.FindAsync(id);

        if (memory == null)
        {
            return NotFound(new { message = $"Memory with ID {id} was not found." });
        }

        _context.Memories.Remove(memory);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted memory with ID {Id}", id);

        return NoContent();
    }

    /// <summary>
    /// POST: /api/memories/summarize
    /// Takes all stored memories and sends them to Google Gemini (gemini-1.5-flash) to generate a summary/insight.
    /// </summary>
    [HttpPost("summarize")]
    [ProducesResponseType(typeof(SummarizeResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SummarizeResponseDto>> Summarize(CancellationToken cancellationToken)
    {
        try
        {
            var memories = await _context.Memories
                .AsNoTracking()
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync(cancellationToken);

            if (memories.Count == 0)
            {
                return Ok(new SummarizeResponseDto
                {
                    Summary = "No memories saved yet. Please add some notes or memories first to generate insights!",
                    MemoriesAnalyzed = 0,
                    IsAiGenerated = false,
                    Notice = "Database has 0 records."
                });
            }

            _logger.LogInformation("Calling Gemini service to summarize {Count} memories...", memories.Count);
            var response = await _geminiService.SummarizeMemoriesAsync(memories, cancellationToken);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to summarize memories due to database or service issue.");
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = "Database connection error while retrieving memories to summarize. Please verify your MySQL credentials in appsettings.json.",
                details = ex.Message
            });
        }
    }
}
