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

            string extension = input.ContentType.ToLower() switch
            {
                "image/png" => ".png",
                "image/gif" => ".gif",
                "image/webp" => ".webp",
                "image/svg+xml" => ".svg",
                _ => ".jpg"
            };

            var blobName = $"avatar_{CurrentUser.Id}_{DateTime.Now.Ticks}{extension}";

            await _blobContainer.SaveAsync(blobName, bytes, overrideExisting: true);

            var user = await _userManager.GetByIdAsync(CurrentUser.Id.Value);
            user.SetProperty("AvatarBlobName", blobName);
            await _userManager.UpdateAsync(user);
        }

        [HttpGet("api/app/profile/my-avatar")]
        public async Task<string> GetMyAvatarAsync()
        {
            var user = await _userManager.GetByIdAsync(CurrentUser.Id.Value);
            var blobName = user.GetProperty<string>("AvatarBlobName");

            if (!string.IsNullOrWhiteSpace(blobName))
            {
                var bytes = await _blobContainer.GetAllBytesOrNullAsync(blobName);
                if (bytes != null)
                {
                    var extension = System.IO.Path.GetExtension(blobName).ToLower();
                    var mimeType = extension switch
                    {
                        ".png" => "image/png",
                        ".gif" => "image/gif",
                        ".webp" => "image/webp",
                        ".svg" => "image/svg+xml",
                        _ => "image/jpeg"
                    };

                    return $"data:{mimeType};base64,{Convert.ToBase64String(bytes)}";
                }
            }

            // Trường hợp chưa upload: Lấy ảnh Chibi mặc định
            int totalChibiImages = 29;
            int imageIndex = (Math.Abs(user.UserName.GetHashCode()) % totalChibiImages) + 1;

            return $"assets/images/chibi/avatar ({imageIndex}).png";
        }
    }
}