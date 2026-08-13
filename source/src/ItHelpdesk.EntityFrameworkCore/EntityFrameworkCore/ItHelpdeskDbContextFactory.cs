using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace ItHelpdesk.EntityFrameworkCore;

/* This class is needed for EF Core console commands
 * (like Add-Migration and Update-Database commands) */
public class ItHelpdeskDbContextFactory : IDesignTimeDbContextFactory<ItHelpdeskDbContext>
{
    public ItHelpdeskDbContext CreateDbContext(string[] args)
    {
        var configuration = BuildConfiguration();
        
        ItHelpdeskEfCoreEntityExtensionMappings.Configure();

        var builder = new DbContextOptionsBuilder<ItHelpdeskDbContext>()
            .UseSqlServer(configuration.GetConnectionString("Default"));
        
        return new ItHelpdeskDbContext(builder.Options);
    }

    private static IConfigurationRoot BuildConfiguration()
    {
        var builder = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), "../ItHelpdesk.DbMigrator/"))
            .AddJsonFile("appsettings.json", optional: false)
            .AddEnvironmentVariables();

        return builder.Build();
    }
}
