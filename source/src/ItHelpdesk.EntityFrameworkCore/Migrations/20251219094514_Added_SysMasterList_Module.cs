using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ItHelpdesk.Migrations
{
    /// <inheritdoc />
    public partial class Added_SysMasterList_Module : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SysMasterLists",
                columns: table => new
                {
                    MasterListID = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MasterListCode = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    MasterListGroupCde = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    MasterListCdeName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    MastListDefaultValue = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    MastListExtendValue1 = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    MastListExtendValue2 = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    MastListExtendValue3 = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    MastListExtendValue4 = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    MastListExtendValue5 = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    OrderNo = table.Column<int>(type: "int", maxLength: 200, nullable: true),
                    MasterCde = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: true),
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
                    table.PrimaryKey("PK_SysMasterLists", x => x.MasterListID);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SysMasterLists");
        }
    }
}
