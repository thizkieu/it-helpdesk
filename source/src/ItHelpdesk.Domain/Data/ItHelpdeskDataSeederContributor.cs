using System;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using ItHelpdesk.Tickets;
using ItHelpdesk.Teams;
using ItHelpdesk.Categories;
using ItHelpdesk.Services;
using ItHelpdesk.Priorities;

namespace ItHelpdesk.Data
{
    public class ItHelpdeskDataSeederContributor : IDataSeedContributor, ITransientDependency
    {
        private readonly IdentityUserManager _userManager;
        private readonly IdentityRoleManager _roleManager;
        private readonly IRepository<Team, long> _teamRepository;
        private readonly IRepository<Category, long> _categoryRepository;
        private readonly IRepository<Service, long> _serviceRepository;
        private readonly IRepository<Priority, long> _priorityRepository;
        private readonly IRepository<Ticket, long> _ticketRepository;

        public ItHelpdeskDataSeederContributor(
            IdentityUserManager userManager, IdentityRoleManager roleManager,
            IRepository<Team, long> teamRepository, IRepository<Category, long> categoryRepository,
            IRepository<Service, long> serviceRepository, IRepository<Priority, long> priorityRepository,
            IRepository<Ticket, long> ticketRepository)
        {
            _userManager = userManager; _roleManager = roleManager;
            _teamRepository = teamRepository; _categoryRepository = categoryRepository;
            _serviceRepository = serviceRepository; _priorityRepository = priorityRepository;
            _ticketRepository = ticketRepository;
        }

        public async Task SeedAsync(DataSeedContext context)
        {
            try
            {
                // 1. KHỞI TẠO ROLES CHUẨN HỆ THỐNG
                string[] roles = { "Admin", "TeamLeader", "Technician", "End_User" };
                foreach (var role in roles)
                {
                    if (await _roleManager.FindByNameAsync(role) == null)
                        await _roleManager.CreateAsync(new IdentityRole(Guid.NewGuid(), role));
                }

                // 2. TẠO TÀI KHOẢN CỐ ĐỊNH CHO CHỊ (thizkieu)
                const string defaultPassword = "ThuyKieu11052024@tk_";

                var specialUser = await _userManager.FindByNameAsync("thizkieu");
                if (specialUser == null)
                {
                    specialUser = new IdentityUser(Guid.NewGuid(), "thizkieu", "thuykieukk0101@gmail.com");
                    specialUser.SetProperty("Surname", "Nguyễn Thị");
                    specialUser.SetProperty("Name", "Thuý Kiều");
                    await _userManager.CreateAsync(specialUser, defaultPassword);
                    await _userManager.SetRolesAsync(specialUser, new[] { "Admin" });
                }

                // 3. KHỞI TẠO CÁC USER ĐÚNG LOGIC (DÙNG CHUNG MẬT KHẨU & CHUẨN HÓA THÔNG TIN)
                var adminUser = await CreateUserAsync("admin_sys", defaultPassword, "Quản Trị", "System Admin", "Admin");
                var endUser = await CreateUserAsync("khachhang", defaultPassword, "Khách Hàng", "End User", "End_User");

                // Đội Phần Mềm: Leader và KTV
                var leadPM = await CreateUserAsync("lead_pm", defaultPassword, "Trưởng Nhóm", "Software Lead", "TeamLeader", "Technician");
                var techPM = await CreateUserAsync("tech_pm", defaultPassword, "Kỹ Thuật Viên", "Software Tech", "Technician");

                // Đội Mạng: Leader và KTV
                var leadNW = await CreateUserAsync("lead_nw", defaultPassword, "Trưởng Nhóm", "Network Lead", "TeamLeader", "Technician");
                var techNW = await CreateUserAsync("tech_nw", defaultPassword, "Kỹ Thuật Viên", "Network Tech", "Technician");

                // 4. TẠO MASTER DATA ĐẦY ĐỦ ĐA NGÔN NGỮ (VI - EN) VÀ KHÓA NGOẠI CHẶT CHẼ
                if (await _priorityRepository.GetCountAsync() == 0)
                {
                    var pCritical = await _priorityRepository.InsertAsync(new Priority { Code = "P1", Name_Vi = "Khẩn cấp", Name_En = "Critical", Color = "#ef4444", ResponseMinutes = 15, ResolutionMinutes = 120, IsActive = true }, autoSave: true);
                    var pHigh = await _priorityRepository.InsertAsync(new Priority { Code = "P2", Name_Vi = "Cao", Name_En = "High", Color = "#f59e0b", ResponseMinutes = 30, ResolutionMinutes = 240, IsActive = true }, autoSave: true);
                    var pMedium = await _priorityRepository.InsertAsync(new Priority { Code = "P3", Name_Vi = "Trung bình", Name_En = "Medium", Color = "#3b82f6", ResponseMinutes = 60, ResolutionMinutes = 480, IsActive = true }, autoSave: true);

                    var teamPM = await _teamRepository.InsertAsync(new Team { Code = "TEAM_PM", Name_Vi = "Đội Hỗ trợ Phần mềm", Name_En = "Software Support Team", IsActive = true }, autoSave: true);
                    var teamNW = await _teamRepository.InsertAsync(new Team { Code = "TEAM_NW", Name_Vi = "Đội Kỹ thuật Mạng", Name_En = "Network Tech Team", IsActive = true }, autoSave: true);

                    var catPM = await _categoryRepository.InsertAsync(new Category { Code = "CAT_PM", Name_Vi = "Phần mềm & Hệ thống ERP", Name_En = "Software & ERP Systems", DefaultTeamId = teamPM.Id, IsActive = true }, autoSave: true);
                    var catNW = await _categoryRepository.InsertAsync(new Category { Code = "CAT_NW", Name_Vi = "Hạ tầng & Kết nối", Name_En = "Infrastructure & Network", DefaultTeamId = teamNW.Id, IsActive = true }, autoSave: true);

                    var srvERP = await _serviceRepository.InsertAsync(new Service { Code = "SRV_ERP", Name_Vi = "Lỗi đăng nhập phần mềm", Name_En = "ERP Login Error", CategoryId = catPM.Id, IsActive = true }, autoSave: true);
                    var srvCaiWin = await _serviceRepository.InsertAsync(new Service { Code = "SRV_WIN", Name_Vi = "Cài đặt phần mềm máy tính", Name_En = "Software Installation", CategoryId = catPM.Id, IsActive = true }, autoSave: true);
                    var srvWifi = await _serviceRepository.InsertAsync(new Service { Code = "SRV_WIFI", Name_Vi = "Mất kết nối Internet", Name_En = "Internet Outage", CategoryId = catNW.Id, IsActive = true }, autoSave: true);

                    // 5. TẠO TICKETS LẤP ĐẦY TRANG DASHBOARD VÀ HÀNG ĐỢI
                    if (await _ticketRepository.GetCountAsync() == 0)
                    {
                        var t1 = new Ticket
                        {
                            TicketNo = "TK-" + DateTime.Now.ToString("yyMMdd") + "01",
                            Title = "Kế toán không đăng nhập được phần mềm ERP",
                            Description = "Hệ thống báo lỗi Timeout expired liên tục ở phòng kế toán.",
                            AssigneeId = leadPM.Id,
                            TeamId = teamPM.Id,
                            CategoryId = catPM.Id,
                            ServiceId = srvERP.Id,
                            PriorityId = pCritical.Id,
                            Status = TicketStatus.InProgress,
                            TargetResolutionTime = DateTime.Now.AddDays(-1).AddMinutes(120)
                        };
                        ForceSetAuditFields(t1, endUser.Id, DateTime.Now.AddDays(-1));
                        await _ticketRepository.InsertAsync(t1, autoSave: true);

                        var t2 = new Ticket
                        {
                            TicketNo = "TK-" + DateTime.Now.ToString("yyMMdd") + "02",
                            Title = "Cài đặt MS Office cho nhân sự mới",
                            Description = "Nhân sự mới phòng Kinh doanh cần cài đặt bộ Office bản quyền.",
                            AssigneeId = techPM.Id,
                            TeamId = teamPM.Id,
                            CategoryId = catPM.Id,
                            ServiceId = srvCaiWin.Id,
                            PriorityId = pMedium.Id,
                            Status = TicketStatus.Assigned,
                            TargetResolutionTime = DateTime.Now.AddHours(8)
                        };
                        ForceSetAuditFields(t2, endUser.Id, DateTime.Now.AddHours(-2));
                        await _ticketRepository.InsertAsync(t2, autoSave: true);

                        var t3 = new Ticket
                        {
                            TicketNo = "TK-" + DateTime.Now.ToString("yyMMdd") + "03",
                            Title = "Phòng họp lớn mất sóng Wifi diện rộng",
                            Description = "Access Point chính tầng 2 chớp đèn đỏ, không thiết bị nào kết nối được.",
                            AssigneeId = techNW.Id,
                            TeamId = teamNW.Id,
                            CategoryId = catNW.Id,
                            ServiceId = srvWifi.Id,
                            PriorityId = pHigh.Id,
                            Status = TicketStatus.Assigned,
                            TargetResolutionTime = DateTime.Now.AddDays(-2)
                        };
                        ForceSetAuditFields(t3, endUser.Id, DateTime.Now.AddDays(-3));
                        await _ticketRepository.InsertAsync(t3, autoSave: true);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("================ LỖI SEED DATA ================");
                Console.WriteLine(ex.Message);
                if (ex.InnerException != null) Console.WriteLine("CHI TIẾT: " + ex.InnerException.Message);
                Console.WriteLine("===============================================");
                throw;
            }
        }

        private void ForceSetAuditFields(Ticket ticket, Guid creatorId, DateTime creationTime)
        {
            var creatorProp = typeof(Ticket).GetProperty("CreatorId", BindingFlags.Public | BindingFlags.Instance | BindingFlags.NonPublic);
            if (creatorProp != null && creatorProp.CanWrite) creatorProp.SetValue(ticket, creatorId);

            var creationTimeProp = typeof(Ticket).GetProperty("CreationTime", BindingFlags.Public | BindingFlags.Instance | BindingFlags.NonPublic);
            if (creationTimeProp != null && creationTimeProp.CanWrite) creationTimeProp.SetValue(ticket, creationTime);
        }

        private async Task<IdentityUser> CreateUserAsync(string userName, string password, string surname, string name, params string[] roles)
        {
            var user = await _userManager.FindByNameAsync(userName);
            if (user == null)
            {
                user = new IdentityUser(Guid.NewGuid(), userName, $"{userName}@company.com");
                user.SetProperty("Surname", surname);
                user.SetProperty("Name", name);
                await _userManager.CreateAsync(user, password);
                await _userManager.SetRolesAsync(user, roles);
            }
            return user;
        }
    }
}