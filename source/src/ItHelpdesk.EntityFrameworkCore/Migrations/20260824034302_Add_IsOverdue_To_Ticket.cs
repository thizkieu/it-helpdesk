using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ItHelpdesk.Migrations
{
    /// <inheritdoc />
    public partial class Add_IsOverdue_To_Ticket : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsOverdue",
                table: "AppTickets",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsOverdue",
                table: "AppTickets");
        }
    }
}
