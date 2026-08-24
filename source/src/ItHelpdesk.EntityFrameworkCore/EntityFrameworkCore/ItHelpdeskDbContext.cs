using ItHelpdesk.Books;
using ItHelpdesk.Categories;
using ItHelpdesk.Employees;
using ItHelpdesk.KnowledgeBase;
using ItHelpdesk.LocalizationManagement.Languages;
using ItHelpdesk.LocalizationManagement.LanguageTexts;
using ItHelpdesk.Priorities;
using ItHelpdesk.Services;
using ItHelpdesk.SysMasterLists;
using ItHelpdesk.Tickets;

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
    /* =========================================================
       1. CÁC BẢNG CUSTOM
       ========================================================= */
    public DbSet<Book> Books { get; set; }
    public DbSet<Language> Languages { get; set; }
    public DbSet<LanguageText> LanguageTexts { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<SysMasterList> SysMasterLists { get; set; }
    public DbSet<Categories.Category> Categories { get; set; }
    public DbSet<Priorities.Priority> Priorities { get; set; }
    public DbSet<Services.Service> Services { get; set; }
    public DbSet<Teams.Team> Teams { get; set; }
    public DbSet<Ticket> Tickets { get; set; }
    public DbSet<TicketComment> TicketComments { get; set; }
    public DbSet<TicketActivity> TicketActivities { get; set; }
    public DbSet<TicketAttachment> TicketAttachments { get; set; }

    /* =========================================================
       2. CÁC BẢNG MẶC ĐỊNH CỦA ABP (BẮT BUỘC PHẢI CÓ ĐỂ KHÔNG LỖI)
       ========================================================= */
    #region Entities from the modules

    // Identity
    public DbSet<IdentityUser> Users { get; set; }
    public DbSet<IdentityRole> Roles { get; set; }
    public DbSet<IdentityClaimType> ClaimTypes { get; set; }
    public DbSet<OrganizationUnit> OrganizationUnits { get; set; }
    public DbSet<IdentitySecurityLog> SecurityLogs { get; set; }
    public DbSet<IdentityLinkUser> LinkUsers { get; set; }
    public DbSet<IdentityUserDelegation> UserDelegations { get; set; }
    public DbSet<IdentitySession> Sessions { get; set; }
    public DbSet<FaqItem> FaqItems { get; set; }

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

        // Cấu hình các bảng
        builder.Entity<Book>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "Books", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();
            b.Property(x => x.Name).IsRequired().HasMaxLength(128);
        });

        builder.Entity<Categories.Category>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "Categories", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();
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

        builder.Entity<Ticket>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "Tickets", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.TicketNo).IsRequired().HasMaxLength(50);
            b.Property(x => x.Title).IsRequired().HasMaxLength(255);
            b.Property(x => x.Description).IsRequired();

            b.HasIndex(x => x.TicketNo).IsUnique();

            b.HasOne<Categories.Category>().WithMany().HasForeignKey(x => x.CategoryId).IsRequired();
            b.HasOne<Priorities.Priority>().WithMany().HasForeignKey(x => x.PriorityId).IsRequired();
            b.HasOne<Services.Service>().WithMany().HasForeignKey(x => x.ServiceId).IsRequired();
        });
        builder.Entity<TicketComment>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "TicketComments", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention(); // Ép ABP tự động tạo các cột hệ thống (Id, CreationTime...)

            // Cấu hình khóa ngoại liên kết với bảng Tickets
            b.HasOne<Ticket>().WithMany().HasForeignKey(x => x.TicketId).IsRequired();
        });

        builder.Entity<TicketActivity>(b =>
        {
            // Đặt tên bảng theo chuẩn của ABP (có Prefix)
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "TicketActivities", ItHelpdeskConsts.DbSchema);

            // Tự động map các trường kế thừa của ABP (Id, CreationTime, CreatorId)
            b.ConfigureByConvention();

            // Ràng buộc độ dài để tối ưu Database
            b.Property(x => x.ActivityType).IsRequired().HasMaxLength(128);
            b.Property(x => x.Description).IsRequired().HasMaxLength(2000);
            b.Property(x => x.OldValue).HasMaxLength(1000);
            b.Property(x => x.NewValue).HasMaxLength(1000);

            // Đánh index cho TicketId để sau này truy vấn Timeline cực nhanh
            b.HasIndex(x => x.TicketId);
        });

        builder.Entity<TicketAttachment>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "TicketAttachments", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.FileName).IsRequired().HasMaxLength(255);
            b.Property(x => x.BlobName).IsRequired().HasMaxLength(255);
            b.Property(x => x.ContentType).HasMaxLength(128);

            // Khóa ngoại liên kết với bảng Tickets
            b.HasOne<Ticket>().WithMany().HasForeignKey(x => x.TicketId).IsRequired();
        });

        // Cấu hình bảng FaqItem
        builder.Entity<FaqItem>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "FaqItems", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Question).IsRequired().HasMaxLength(500);
            b.Property(x => x.Answer).IsRequired();
            b.Property(x => x.Category).HasMaxLength(128);
        });

        builder.ApplyConfiguration(new LanguageEfCoreMapping());
        builder.ApplyConfiguration(new LanguageTextEfCoreMapping());
        builder.ApplyConfiguration(new EmployeeEfCoreMapping());
        builder.ApplyConfiguration(new SysMasterListEfCoreMapping());
    }
}