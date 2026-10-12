using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ItHelpdesk.Migrations
{
    /// <inheritdoc />
    public partial class Add_Ticket_ParentTicketId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "ParentTicketId",
                table: "AppTickets",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppTickets_ParentTicketId",
                table: "AppTickets",
                column: "ParentTicketId");

            migrationBuilder.AddForeignKey(
                name: "FK_AppTickets_AppTickets_ParentTicketId",
                table: "AppTickets",
                column: "ParentTicketId",
                principalTable: "AppTickets",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppTickets_AppTickets_ParentTicketId",
                table: "AppTickets");

            migrationBuilder.DropIndex(
                name: "IX_AppTickets_ParentTicketId",
                table: "AppTickets");

            migrationBuilder.DropColumn(
                name: "ParentTicketId",
                table: "AppTickets");
        }
    }
}
