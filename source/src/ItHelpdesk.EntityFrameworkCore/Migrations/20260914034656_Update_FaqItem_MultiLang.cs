using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ItHelpdesk.Migrations
{
    /// <inheritdoc />
    public partial class Update_FaqItem_MultiLang : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Question",
                table: "AppFaqItems",
                newName: "Question_Vi");

            migrationBuilder.RenameColumn(
                name: "Answer",
                table: "AppFaqItems",
                newName: "Answer_Vi");

            migrationBuilder.AddColumn<string>(
                name: "Answer_En",
                table: "AppFaqItems",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Question_En",
                table: "AppFaqItems",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Answer_En",
                table: "AppFaqItems");

            migrationBuilder.DropColumn(
                name: "Question_En",
                table: "AppFaqItems");

            migrationBuilder.RenameColumn(
                name: "Question_Vi",
                table: "AppFaqItems",
                newName: "Question");

            migrationBuilder.RenameColumn(
                name: "Answer_Vi",
                table: "AppFaqItems",
                newName: "Answer");
        }
    }
}
