using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;

namespace ItHelpdesk.SysMasterLists
{
    public class SysMasterListEfCoreMapping : IEntityTypeConfiguration<SysMasterList>
    {
        public void Configure(EntityTypeBuilder<SysMasterList> builder)
        {
            builder.ToTable("SysMasterLists");

            builder.HasKey(x => x.MasterListID);
            builder.Property(x => x.MasterListCode).IsRequired().HasMaxLength(50).IsUnicode(false);
            builder.Property(x => x.MasterListGroupCde).IsRequired().HasMaxLength(50).IsUnicode(false);
            builder.Property(x => x.MasterListCdeName).HasMaxLength(500);
            builder.Property(x => x.MastListDefaultValue).HasMaxLength(500);
            builder.Property(x => x.MastListExtendValue1).HasMaxLength(500);
            builder.Property(x => x.MastListExtendValue2).HasMaxLength(500);
            builder.Property(x => x.MastListExtendValue3).HasMaxLength(500);
            builder.Property(x => x.MastListExtendValue4).HasMaxLength(500);
            builder.Property(x => x.MastListExtendValue5).HasMaxLength(500);
            builder.Property(x => x.Description).HasMaxLength(200);
            builder.Property(x => x.OrderNo).HasMaxLength(200);
            builder.Property(x => x.IsActive);
            builder.Property(x => x.MasterListCode).HasMaxLength(50).IsUnicode(false);

            builder.Property(x => x.TenantId).HasMaxLength(50);
            builder.Property(x => x.IsDeleted);
            builder.Property(x => x.RowVersion).HasMaxLength(50).IsUnicode(false).IsRowVersion();
            builder.Property(x => x.CreateBy).HasMaxLength(50).IsRequired().IsUnicode(false);
            builder.Property(x => x.CreateDate).IsRequired();
            builder.Property(x => x.ModifiedBy).HasMaxLength(50).IsUnicode(false);
            builder.Property(x => x.ModifiedDate);
        }
    }
}
