using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ItHelpdesk.LocalizationManagement.Languages
{
    public class LanguageEfCoreMapping : IEntityTypeConfiguration<Language>
    {
        public void Configure(EntityTypeBuilder<Language> builder)
        {
            builder.ToTable("AbpLanguages");

            builder.Property(x => x.CultureName).IsRequired().HasMaxLength(64);
            builder.Property(x => x.DisplayName).IsRequired().HasMaxLength(128);
            builder.Property(x => x.Icon).HasMaxLength(64);
        }
    }
}
