using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;

namespace ItHelpdesk.Employees
{
    public class EmployeeEfCoreMapping : IEntityTypeConfiguration<Employee>
    {
        public void Configure(EntityTypeBuilder<Employee> builder)
        {
            builder.ToTable("Employees");

            builder.HasKey(x => x.ID);
            builder.Property(x => x.ID).HasColumnType("numeric(18,0)");
            builder.Property(x => x.EmployeeCode).IsRequired().HasMaxLength(50);
            builder.Property(x => x.FirstName).IsRequired().HasMaxLength(50);
            builder.Property(x => x.LastName).IsRequired().HasMaxLength(50);
            builder.Property(x => x.Email).HasMaxLength(100).IsUnicode(false);
            builder.Property(x => x.Sex).HasMaxLength(50);
            builder.Property(x => x.Birthday).HasColumnType("date");
            builder.Property(x => x.BirthPlace).HasColumnType("nvarchar(max)");

            builder.Property(x => x.IdentityCard).HasMaxLength(50);
            builder.Property(x => x.IdentityCardDate).HasColumnType("date");
            builder.Property(x => x.IdentityCardPlace).HasColumnType("nvarchar(max)");

            builder.Property(x => x.IdentityCard2).HasMaxLength(50);
            builder.Property(x => x.IdentityCardDate2).HasColumnType("date");
            builder.Property(x => x.IdentityCardPlace2).HasColumnType("nvarchar(max)");

            builder.Property(x => x.ReligiousCode).HasMaxLength(50);
            builder.Property(x => x.NationalityCode).HasMaxLength(50);
            builder.Property(x => x.EducatedCode).HasMaxLength(50);

            builder.Property(x => x.PayDate).HasColumnType("date");
            builder.Property(x => x.ManagerId);
            builder.Property(x => x.IsFederation);

            builder.Property(x => x.DepartmentCode).HasMaxLength(50).IsUnicode(false);
            builder.Property(x => x.CompetenceCode).HasMaxLength(50).IsUnicode(false);
            builder.Property(x => x.JobCode).HasMaxLength(50);

            builder.Property(x => x.DateOfWork).HasColumnType("date");
            builder.Property(x => x.DateOfEntry).HasColumnType("date");
            builder.Property(x => x.FamilyExemptionNumber);
            builder.Property(x => x.FamilyExemptionDate).HasColumnType("date");
            builder.Property(x => x.TaxYourself).HasMaxLength(50).IsUnicode(false);
            builder.Property(x => x.IsInactivity);
            builder.Property(x => x.BankAccount).HasMaxLength(50);
            builder.Property(x => x.BankCode).HasMaxLength(50);
            builder.Property(x => x.PermanentAddress).HasColumnType("nvarchar(max)");
            builder.Property(x => x.TemporaryAddress).HasColumnType("nvarchar(max)");
            builder.Property(x => x.PhoneNumber).HasMaxLength(50).IsUnicode(false);
            builder.Property(x => x.MaritalStatus).HasMaxLength(50).IsUnicode(false);
            builder.Property(x => x.Image).HasColumnType("nvarchar(max)");
            builder.Property(x => x.InactivityDate);
            builder.Property(x => x.InsuranceNumber).HasMaxLength(100).IsUnicode(false);
            builder.Property(x => x.Password).HasColumnType("nvarchar(max)");
            builder.Property(x => x.IsFirstLogin);
            builder.Property(x => x.LanguageName).HasMaxLength(50).IsUnicode(false);
            builder.Property(x => x.OtpCde).HasMaxLength(10).IsUnicode(false);
            builder.Property(x => x.OtpExpiresDate);

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
