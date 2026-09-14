using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using MemoryAgent.Api.Data;
using MemoryAgent.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// -------------------------------------------------------------
// 1. Controller & JSON Configuration
// -------------------------------------------------------------
builder.Services.AddControllers();

// -------------------------------------------------------------
// 2. Swagger / OpenAPI Configuration
// -------------------------------------------------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AI Memory Agent API",
        Version = "v1",
        Description = "ASP.NET Core Web API for storing user memories and summarizing them with Google Gemini (gemini-1.5-flash)."
    });
});

// -------------------------------------------------------------
// 3. CORS Policy Configuration
// Allows requests from the React frontend running on Vite (default port 5173)
// -------------------------------------------------------------
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://127.0.0.1:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// -------------------------------------------------------------
// 4. Entity Framework Core with MySQL (Pomelo Provider)
// -------------------------------------------------------------
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=localhost;Port=3306;Database=MemoryAgentDb;User=root;Password=your_password;";

// We use explicit MySqlServerVersion (MySQL 8.0+) to avoid immediate network connection requirement during DI registration
var serverVersion = new MySqlServerVersion(new Version(8, 0, 36));

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseMySql(connectionString, serverVersion, mySqlOptions =>
    {
        mySqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorNumbersToAdd: null);
    });
});

// -------------------------------------------------------------
// 5. Dependency Injection: Gemini AI Service with HttpClient
// -------------------------------------------------------------
builder.Services.AddHttpClient<IGeminiService, GeminiService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

var app = builder.Build();

// -------------------------------------------------------------
// 6. Database Initialization (Auto-Create Tables if MySQL is running)
// -------------------------------------------------------------
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var dbContext = services.GetRequiredService<AppDbContext>();
        logger.LogInformation("Applying database migrations...");
        await dbContext.Database.MigrateAsync();
        logger.LogInformation("Database migrations applied successfully.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Could not automatically apply MySQL migrations. Verify MySQL is running and credentials in appsettings.json are correct.");
    }
}

// -------------------------------------------------------------
// 7. HTTP Request Pipeline Configuration
// -------------------------------------------------------------
// Enable Swagger in Development and Staging for easy API exploration
if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Local"))
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "AI Memory Agent API v1");
        c.RoutePrefix = "swagger"; // Navigate to /swagger
    });
}

// Enable CORS
app.UseCors("AllowFrontend");

// Map API Controllers
app.MapControllers();

app.Run();
