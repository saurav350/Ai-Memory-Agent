using Microsoft.EntityFrameworkCore;
using MemoryAgent.Api.Models;

namespace MemoryAgent.Api.Data;

/// <summary>
/// Database context for the AI Memory Agent using MySQL via Pomelo.EntityFrameworkCore.MySql.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// Stored memories table.
    /// </summary>
    public DbSet<Memory> Memories => Set<Memory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure the Memory entity table and indexes
        modelBuilder.Entity<Memory>(entity =>
        {
            entity.ToTable("Memories");

            entity.HasKey(m => m.Id);

            entity.Property(m => m.Content)
                  .IsRequired()
                  .HasColumnType("TEXT");

            entity.Property(m => m.Category)
                  .IsRequired()
                  .HasMaxLength(100)
                  .HasDefaultValue("General");

            entity.Property(m => m.CreatedAt)
                  .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");

            // Index category and created date for fast filtering and sorting
            entity.HasIndex(m => m.Category);
            entity.HasIndex(m => m.CreatedAt);
        });
    }
}
