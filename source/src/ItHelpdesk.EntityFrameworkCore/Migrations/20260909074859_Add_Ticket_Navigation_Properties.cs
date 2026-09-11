using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ItHelpdesk.Migrations
{
    /// <inheritdoc />
    public partial class Add_Ticket_Navigation_Properties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppTickets_AppCategories_CategoryId",
                table: "AppTickets");

            migrationBuilder.DropForeignKey(
                name: "FK_AppTickets_AppPriorities_PriorityId",
                table: "AppTickets");

            migrationBuilder.DropForeignKey(
                name: "FK_AppTickets_AppServices_ServiceId",
                table: "AppTickets");

            migrationBuilder.AddForeignKey(
                name: "FK_AppTickets_AppCategories_CategoryId",
                table: "AppTickets",
                column: "CategoryId",
                principalTable: "AppCategories",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AppTickets_AppPriorities_PriorityId",
                table: "AppTickets",
                column: "PriorityId",
                principalTable: "AppPriorities",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AppTickets_AppServices_ServiceId",
                table: "AppTickets",
                column: "ServiceId",
                principalTable: "AppServices",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppTickets_AppCategories_CategoryId",
                table: "AppTickets");

            migrationBuilder.DropForeignKey(
                name: "FK_AppTickets_AppPriorities_PriorityId",
                table: "AppTickets");

            migrationBuilder.DropForeignKey(
                name: "FK_AppTickets_AppServices_ServiceId",
                table: "AppTickets");

            migrationBuilder.AddForeignKey(
                name: "FK_AppTickets_AppCategories_CategoryId",
                table: "AppTickets",
                column: "CategoryId",
                principalTable: "AppCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AppTickets_AppPriorities_PriorityId",
                table: "AppTickets",
                column: "PriorityId",
                principalTable: "AppPriorities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AppTickets_AppServices_ServiceId",
                table: "AppTickets",
                column: "ServiceId",
                principalTable: "AppServices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
