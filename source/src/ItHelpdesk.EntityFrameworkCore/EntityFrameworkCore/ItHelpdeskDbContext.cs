using ItHelpdesk.Books;
using ItHelpdesk.Categories;
using ItHelpdesk.Employees;
using ItHelpdesk.KnowledgeBase;
using ItHelpdesk.LocalizationManagement.Languages;
using ItHelpdesk.LocalizationManagement.LanguageTexts;
using ItHelpdesk.Priorities;
using ItHelpdesk.Security;
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
       1. CÁC BẢNG CUSTOM (NGHIỆP VỤ RIÊNG CỦA IT HELPDESK)
       ========================================================= */
    // Master Data & Danh mục
    public DbSet<Book> Books { get; set; }
    public DbSet<Language> Languages { get; set; }
    public DbSet<LanguageText> LanguageTexts { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<SysMasterList> SysMasterLists { get; set; }

    // Helpdesk Core
    public DbSet<Categories.Category> Categories { get; set; }
    public DbSet<Priorities.Priority> Priorities { get; set; }
    public DbSet<Services.Service> Services { get; set; }
    public DbSet<Teams.Team> Teams { get; set; }

    // Ticket & Activity
    public DbSet<Ticket> Tickets { get; set; }
    public DbSet<TicketComment> TicketComments { get; set; }
    public DbSet<TicketActivity> TicketActivities { get; set; }
    public DbSet<TicketAttachment> TicketAttachments { get; set; }

    // Tiện ích mở rộng
    public DbSet<FaqItem> FaqItems { get; set; }
    public DbSet<ItHelpdesk.Notifications.AppNotification> AppNotifications { get; set; }
    public DbSet<SecurityAlertLog> SecurityAlertLogs { get; set; }

    /* =========================================================
       2. CÁC BẢNG MẶC ĐỊNH CỦA ABP (KHÔNG ĐƯỢC XÓA HOẶC SỬA)
       ========================================================= */
    #region Entities from the modules
    public DbSet<IdentityUser> Users { get; set; }
    public DbSet<IdentityRole> Roles { get; set; }
    public DbSet<IdentityClaimType> ClaimTypes { get; set; }
    public DbSet<OrganizationUnit> OrganizationUnits { get; set; }
    public DbSet<IdentitySecurityLog> SecurityLogs { get; set; }
    public DbSet<IdentityLinkUser> LinkUsers { get; set; }
    public DbSet<IdentityUserDelegation> UserDelegations { get; set; }
    public DbSet<IdentitySession> Sessions { get; set; }

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

        /* =========================================================
           A. CẤU HÌNH CÁC MODULE MẶC ĐỊNH CỦA ABP
           ========================================================= */
        builder.ConfigurePermissionManagement();
        builder.ConfigureSettingManagement();
        builder.ConfigureBackgroundJobs();
        builder.ConfigureAuditLogging();
        builder.ConfigureFeatureManagement();
        builder.ConfigureIdentity();
        builder.ConfigureOpenIddict();
        builder.ConfigureTenantManagement();
        builder.ConfigureBlobStoring();

        /* =========================================================
                   B. CẤU HÌNH FLUENT API CHO CÁC BẢNG CUSTOM
        ========================================================= */
        // --- 1. Master Data & Helpdesk Core ---
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
            b.Property(x => x.Code).IsRequired().HasMaxLength(50);
            b.Property(x => x.Name_Vi).IsRequired().HasMaxLength(128);
            b.Property(x => x.Name_En).HasMaxLength(128);
        });

        builder.Entity<Priorities.Priority>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "Priorities", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();
            b.Property(x => x.Code).IsRequired().HasMaxLength(50);
            b.Property(x => x.Name_Vi).IsRequired().HasMaxLength(128);
            b.Property(x => x.Name_En).HasMaxLength(128);
            b.Property(x => x.Color).HasMaxLength(50);
        });

        builder.Entity<Services.Service>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "Services", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();
            b.Property(x => x.Code).IsRequired().HasMaxLength(50);
            b.Property(x => x.Name_Vi).IsRequired().HasMaxLength(128);
            b.Property(x => x.Name_En).HasMaxLength(128);
            b.Property(x => x.Description_Vi).HasMaxLength(1000);
            b.Property(x => x.Description_En).HasMaxLength(1000);
        });

        builder.Entity<Teams.Team>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "Teams", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();
            b.Property(x => x.Code).IsRequired().HasMaxLength(50);
            b.Property(x => x.Name_Vi).IsRequired().HasMaxLength(128);
            b.Property(x => x.Name_En).HasMaxLength(128);
        });

        // --- 2. Ticket & Activity (Đã tích hợp đa ngôn ngữ và Ignore thuộc tính cũ) ---
        builder.Entity<Ticket>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "Tickets", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();
            b.Property(x => x.TicketNo).IsRequired().HasMaxLength(50);

            // Đa ngôn ngữ Ticket
            b.Property(x => x.Title_Vi).IsRequired().HasMaxLength(255);
            b.Property(x => x.Title_En).HasMaxLength(255);
            b.Property(x => x.Description_Vi).IsRequired();
            b.Property(x => x.Description_En);

            // Bỏ qua thuộc tính ảo tương thích ngược
            b.Ignore(x => x.Title);
            b.Ignore(x => x.Description);

            b.HasIndex(x => x.TicketNo).IsUnique();

            b.HasOne(x => x.Category)
             .WithMany()
             .HasForeignKey(x => x.CategoryId)
             .IsRequired()
             .OnDelete(DeleteBehavior.NoAction);

            b.HasOne(x => x.Priority)
             .WithMany()
             .HasForeignKey(x => x.PriorityId)
             .IsRequired()
             .OnDelete(DeleteBehavior.NoAction);

            b.HasOne(x => x.Service)
             .WithMany()
             .HasForeignKey(x => x.ServiceId)
             .IsRequired()
             .OnDelete(DeleteBehavior.NoAction);

            b.Property(x => x.ParentTicketId).IsRequired(false);
            b.HasOne<Ticket>()
             .WithMany()
             .HasForeignKey(x => x.ParentTicketId)
             .OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<TicketComment>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "TicketComments", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();

            // Đa ngôn ngữ Comment
            b.Property(x => x.Content_Vi).IsRequired();
            b.Property(x => x.Content_En);
            b.Ignore(x => x.Content);

            b.HasOne<Ticket>().WithMany().HasForeignKey(x => x.TicketId).IsRequired();
        });

        builder.Entity<TicketActivity>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "TicketActivities", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();
            b.Property(x => x.ActivityType).IsRequired().HasMaxLength(128);

            // Đa ngôn ngữ Activity Description
            b.Property(x => x.Description_Vi).IsRequired().HasMaxLength(2000);
            b.Property(x => x.Description_En).HasMaxLength(2000);
            b.Ignore(x => x.Description);

            b.Property(x => x.OldValue).HasMaxLength(1000);
            b.Property(x => x.NewValue).HasMaxLength(1000);
            b.HasIndex(x => x.TicketId);
        });

        builder.Entity<TicketAttachment>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "TicketAttachments", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();
            b.Property(x => x.FileName).IsRequired().HasMaxLength(255);
            b.Property(x => x.BlobName).IsRequired().HasMaxLength(255);
            b.Property(x => x.ContentType).HasMaxLength(128);
            b.HasOne<Ticket>().WithMany().HasForeignKey(x => x.TicketId).IsRequired();
        });

        // --- 3. Knowledge Base (FaqItems) ---
        builder.Entity<FaqItem>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "FaqItems", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();
            b.Property(x => x.Question_Vi).IsRequired().HasMaxLength(500);
            b.Property(x => x.Question_En).HasMaxLength(500);
            b.Property(x => x.Answer_Vi).IsRequired();
            b.Property(x => x.Answer_En);
            b.Property(x => x.Category).HasMaxLength(128);
            b.Property(x => x.Icon).HasMaxLength(50);
        });

        // --- 4. Notifications & Security Logs ---
        builder.Entity<ItHelpdesk.Notifications.AppNotification>(b =>
        {
            b.ToTable("AppNotifications", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();
            b.Property(x => x.Title_Vi).IsRequired().HasMaxLength(255);
            b.Property(x => x.Title_En).HasMaxLength(255);
            b.Property(x => x.Message_Vi).IsRequired().HasMaxLength(1000);
            b.Property(x => x.Message_En).HasMaxLength(1000);
            b.Property(x => x.Type).IsRequired().HasMaxLength(50);
            b.Property(x => x.LinkUrl).HasMaxLength(500);
            b.Ignore(x => x.Title);
            b.Ignore(x => x.Message);
            b.HasIndex(x => x.UserId);
        });

        builder.Entity<SecurityAlertLog>(b =>
        {
            b.ToTable(ItHelpdeskConsts.DbTablePrefix + "SecurityAlertLogs", ItHelpdeskConsts.DbSchema);
            b.ConfigureByConvention();
            b.Property(x => x.AlertType).IsRequired().HasMaxLength(50);
            b.Property(x => x.TargetUserName).HasMaxLength(128);
            b.Property(x => x.ResourceName).HasMaxLength(255);
            b.Property(x => x.IpAddress).HasMaxLength(45);
            b.Property(x => x.Description).HasMaxLength(1000);
            b.HasIndex(x => x.AlertType);
            b.HasIndex(x => x.CreationTime);
        });

        /* =========================================================
           C. MAPPING CONFIGURATIONS QUA LỚP RIÊNG
           ========================================================= */
        builder.ApplyConfiguration(new LanguageEfCoreMapping());
        builder.ApplyConfiguration(new LanguageTextEfCoreMapping());
        builder.ApplyConfiguration(new EmployeeEfCoreMapping());
        builder.ApplyConfiguration(new SysMasterListEfCoreMapping());
    }
}