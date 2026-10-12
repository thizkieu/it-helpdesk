using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ItHelpdesk.Migrations
{
    /// <inheritdoc />
    public partial class Fix_AppNotification_TableName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "EntityId",
                table: "AppAppNotifications",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EntityType",
                table: "AppAppNotifications",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EntityId",
                table: "AppAppNotifications");

            migrationBuilder.DropColumn(
                name: "EntityType",
                table: "AppAppNotifications");
        }
    }
}
