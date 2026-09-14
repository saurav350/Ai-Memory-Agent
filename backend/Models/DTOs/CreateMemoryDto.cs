using System.ComponentModel.DataAnnotations;

namespace MemoryAgent.Api.Models.DTOs;

/// <summary>
/// Data transfer object for creating a new memory.
/// </summary>
public class CreateMemoryDto
{
    [Required(ErrorMessage = "Memory content is required.")]
    [MinLength(1, ErrorMessage = "Memory content cannot be empty.")]
    public string Content { get; set; } = string.Empty;

    [MaxLength(100, ErrorMessage = "Category name cannot exceed 100 characters.")]
    public string Category { get; set; } = "General";
}
