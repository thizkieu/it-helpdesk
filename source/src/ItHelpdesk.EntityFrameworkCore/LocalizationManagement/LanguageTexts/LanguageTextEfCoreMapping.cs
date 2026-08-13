using ItHelpdesk.LocalizationManagement.Languages;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ItHelpdesk.LocalizationManagement.LanguageTexts
{
    public class LanguageTextEfCoreMapping : IEntityTypeConfiguration<LanguageText>
    {
        public void Configure(EntityTypeBuilder<LanguageText> builder)
        {
            builder.ToTable("AbpLanguageTexts");

            builder.Property(x => x.ResourceName).IsRequired().HasMaxLength(256);
            builder.Property(x => x.CultureName).IsRequired().HasMaxLength(64);
            builder.Property(x => x.Key).IsRequired().HasMaxLength(256);
            builder.Property(x => x.Value).IsRequired().HasMaxLength(4000);
        }
    }
}
