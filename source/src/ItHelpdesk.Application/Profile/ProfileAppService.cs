using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;
using Volo.Abp.BlobStoring;
using Volo.Abp.Data;
using Volo.Abp.Identity;

namespace ItHelpdesk.Profile
{
    public class UploadAvatarDto
    {
        public string Base64Content { get; set; }
        public string ContentType { get; set; }
    }

    public class ProfileAppService : ApplicationService
    {
        private readonly IdentityUserManager _userManager;
        private readonly IBlobContainer _blobContainer;

        public ProfileAppService(IdentityUserManager userManager, IBlobContainer blobContainer)
        {
            _userManager = userManager;
            _blobContainer = blobContainer;
        }

        [HttpPost("api/app/profile/upload-avatar")]
        public async Task UploadAvatarAsync(UploadAvatarDto input)
        {
            var bytes = Convert.FromBase64String(input.Base64Content);
            var blobName = $"avatar_{CurrentUser.Id}_{DateTime.Now.Ticks}.jpg";

            // 1. Lưu file thật vào hệ thống (Blob)
            await _blobContainer.SaveAsync(blobName, bytes, overrideExisting: true);

            // 2. Gắn tên file vào Data ẩn (ExtraProperties) của User
            var user = await _userManager.GetByIdAsync(CurrentUser.Id.Value);
            user.SetProperty("AvatarBlobName", blobName);
            await _userManager.UpdateAsync(user);
        }

        [HttpGet("api/app/profile/my-avatar")]
        public async Task<string> GetMyAvatarAsync()
        {
            var user = await _userManager.GetByIdAsync(CurrentUser.Id.Value);
            var blobName = user.GetProperty<string>("AvatarBlobName");

            // NẾU CÓ ẢNH TỰ UPLOAD -> Trả về ảnh thật
            if (!string.IsNullOrWhiteSpace(blobName))
            {
                var bytes = await _blobContainer.GetAllBytesOrNullAsync(blobName);
                if (bytes != null)
                {
                    return $"data:image/jpeg;base64,{Convert.ToBase64String(bytes)}";
                }
            }

            // NẾU KHÔNG CÓ ẢNH -> TRẢ VỀ MEME ĐỘNG VẬT DỄ THƯƠNG TỰ ĐỘNG
            var cuteAnimals = new string[]
            {
                "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=250&h=250&fit=crop", // Mèo ngáo
                "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=250&h=250&fit=crop", // Cún dễ thương
                "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=250&h=250&fit=crop", // Gấu trúc
                "https://images.unsplash.com/photo-1425082661705-1834bfd0999c?w=250&h=250&fit=crop", // Sóc béo
                "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=250&h=250&fit=crop", // Cáo con
                "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=250&h=250&fit=crop"  // Cún pug
            };

            // Thuật toán gán cứng: Cùng 1 tên user sẽ luôn ra đúng 1 con vật
            int index = Math.Abs(user.UserName.GetHashCode()) % cuteAnimals.Length;
            return cuteAnimals[index];
        }
    }
}