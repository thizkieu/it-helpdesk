using ItHelpdesk.Books;
using ItHelpdesk.Employees;
using ItHelpdesk.LocalizationManagement.Languages;
using ItHelpdesk.LocalizationManagement.LanguageTexts;
using ItHelpdesk.SysMasterLists;

//using ItHelpdesk.Languages;
//using ItHelpdesk.LanguageTexts;
using Microsoft.EntityFrameworkCore;
using Volo.Abp.AuditLogging.EntityFrameworkCore;
using Volo.Abp.BackgroundJobs.EntityFrameworkCore;
using Volo.Abp.BlobStoring.Database.EntityFrameworkCore;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore.Modeling;
using Volo.Abp.FeatureManagement.EntityFrameworkCore;
using Volo.Abp.Identity;
using Volo.Abp.Identity.EntityFrameworkCore;
using Volo.Abp.OpenIddict.EntityFrameworkCore;
using Volo.Abp.PermissionManagement.EntityFrameworkCore;
using Volo.Abp.SettingManagement.EntityFrameworkCore;
using Volo.Abp.TenantManagement;
using Volo.Abp.TenantManagement.EntityFrameworkCore;

namespace ItHelpdesk.EntityFrameworkCore;

[ReplaceDbContext(typeof(IIdentityDbContext))]
[ReplaceDbContext(typeof(ITenantManagementDbContext))]
[ConnectionStringName("Default")]
public class ItHelpdeskDbContext :
    AbpDbContext<ItHelpdeskDbContext>,
    ITenantManagementDbContext,
    IIdentityDbContext
{
    /* Add DbSet properties for your Aggregate Roots / Entities here. */

    public DbSet<Book> Books { get; set; }
    public DbSet<Language> Languages { get; set; }
    public DbSet<LanguageText> LanguageTexts { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<SysMasterList> SysMasterLists { get; set; }
    public DbSet<Categories.Category> Categories { get; set; }
    public DbSet<Priorities.Priority> Priorities { get; set; }
    public DbSet<Services.Service> Services { get; set; }
    public DbSet<Teams.Team> Teams { get; set; }
    #region Entities from the modules

    /* Notice: We only implemented IIdentityProDbContext and ISaasDbContext
     * and replaced them for this DbContext. This allows you to perform JOIN
     * queries for the entities of these modules over the repositories easily. You
     * typically don't need that for other modules. But, if you need, you can
     * implement the DbContext interface of the needed module and use ReplaceDbContext
     * attribute just like IIdentityProDbContext and ISaasDbContext.
     *
     * More info: Replacing a DbContext of a module ensures that the related module
     * uses this DbContext on runtime. Otherwise, it will use its own DbContext class.
     */

    // Identity
    public DbSet<IdentityUser> Users { get; set; }
    public DbSet<IdentityRole> Roles { get; set; }
    public DbSet<IdentityClaimType> ClaimTypes { get; set; }
    public DbSet<OrganizationUnit> OrganizationUnits { get; set; }
    public DbSet<IdentitySecurityLog> SecurityLogs { get; set; }
    public DbSet<IdentityLinkUser> LinkUsers { get; set; }
    public DbSet<IdentityUserDelegation> UserDelegations { get; set; }
    public DbSet<IdentitySession> Sessions { get; set; }

    // Tenant Management
    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<TenantConnectionString> TenantConnectionStrings { get; set; }

    #endregion

    public ItHelpdeskDbContext(DbContextOptions<ItHelpdeskDbContext> options)
        : base(options)
    {

    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        /* Include modules to your migration db context */

        builder.ConfigurePermissionManagement();
        builder.ConfigureSettingManagement();
        builder.ConfigureBackgroundJobs();
        builder.ConfigureAuditLogging();
        builder.ConfigureFeatureManagement();
        builder.ConfigureIdentity();
        builder.ConfigureOpenIddict();
        builder.ConfigureTenantManagement();
        builder.ConfigureBlobStoring();

        builder.Entity<Book>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "Books",
                ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention(); //auto configure for the base class props
            b.Property(x => x.Name).IsRequired().HasMaxLength(128);
        });

        builder.Entity<Categories.Category>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "Categories", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention(); // Dòng này cực kỳ quan trọng trong ABP
        });

        builder.Entity<Priorities.Priority>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "Priorities", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();
        });

        builder.Entity<Services.Service>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "Services", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();
        });

        builder.Entity<Teams.Team>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "Teams", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();
        });

        builder.ApplyConfiguration(new LanguageEfCoreMapping());
        builder.ApplyConfiguration(new LanguageTextEfCoreMapping());
        builder.ApplyConfiguration(new EmployeeEfCoreMapping());
        builder.ApplyConfiguration(new SysMasterListEfCoreMapping());

    }
}
