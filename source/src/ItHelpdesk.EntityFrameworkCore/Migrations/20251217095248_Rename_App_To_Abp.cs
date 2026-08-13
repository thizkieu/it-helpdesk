using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ItHelpdesk.Migrations
{
    /// <inheritdoc />
    public partial class Rename_App_To_Abp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_AppLanguageTexts",
                table: "AppLanguageTexts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AppLanguages",
                table: "AppLanguages");

            migrationBuilder.RenameTable(
                name: "AppLanguageTexts",
                newName: "AbpLanguageTexts");

            migrationBuilder.RenameTable(
                name: "AppLanguages",
                newName: "AbpLanguages");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AbpLanguageTexts",
                table: "AbpLanguageTexts",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AbpLanguages",
                table: "AbpLanguages",
                column: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_AbpLanguageTexts",
                table: "AbpLanguageTexts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AbpLanguages",
                table: "AbpLanguages");

            migrationBuilder.RenameTable(
                name: "AbpLanguageTexts",
                newName: "AppLanguageTexts");

            migrationBuilder.RenameTable(
                name: "AbpLanguages",
                newName: "AppLanguages");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AppLanguageTexts",
                table: "AppLanguageTexts",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AppLanguages",
                table: "AppLanguages",
                column: "Id");
        }
    }
}
