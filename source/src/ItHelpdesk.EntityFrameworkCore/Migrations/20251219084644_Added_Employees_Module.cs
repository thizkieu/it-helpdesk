using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ItHelpdesk.Migrations
{
    /// <inheritdoc />
    public partial class Added_Employees_Module : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    ID = table.Column<decimal>(type: "numeric(18,0)", nullable: false),
                    EmployeeCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: true),
                    Sex = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Birthday = table.Column<DateOnly>(type: "date", nullable: true),
                    BirthPlace = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IdentityCard = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IdentityCardDate = table.Column<DateOnly>(type: "date", nullable: true),
                    IdentityCardPlace = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IdentityCard2 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IdentityCardDate2 = table.Column<DateOnly>(type: "date", nullable: true),
                    IdentityCardPlace2 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReligiousCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    NationalityCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    EducatedCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    PayDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ManagerId = table.Column<double>(type: "float", nullable: true),
                    IsFederation = table.Column<bool>(type: "bit", nullable: true),
                    DepartmentCode = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    CompetenceCode = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    JobCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DateOfWork = table.Column<DateOnly>(type: "date", nullable: true),
                    DateOfEntry = table.Column<DateOnly>(type: "date", nullable: true),
                    FamilyExemptionNumber = table.Column<int>(type: "int", nullable: true),
                    FamilyExemptionDate = table.Column<DateOnly>(type: "date", nullable: true),
                    TaxYourself = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    IsInactivity = table.Column<bool>(type: "bit", nullable: true),
                    BankAccount = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    BankCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    PermanentAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TemporaryAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumber = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    MaritalStatus = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    Image = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InactivityDate = table.Column<DateOnly>(type: "date", nullable: true),
                    InsuranceNumber = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: true),
                    Password = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsFirstLogin = table.Column<bool>(type: "bit", nullable: true),
                    LanguageName = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    OtpCde = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: true),
                    OtpExpiresDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: true),
                    TenantId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    RowVersion = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, rowVersion: true, nullable: true),
                    CreateBy = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.ID);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Employees");
        }
    }
}
