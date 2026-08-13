using ItHelpdesk.LocalizationManagement.LanguageTexts;
using Microsoft.Extensions.Localization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Localization;

namespace ItHelpdesk.Localization
{
    //Bước 2 — Tạo Database Localization Contributor trong Application Layer - LanguageText
    public class DatabaseLocalizationContributor : ILocalizationResourceContributor
    {
        private readonly IRepository<LanguageText, Guid> _languageTextRepository;
        private List<LanguageText> _cachedTexts;
        private List<string> _cachedCultures;

        public bool IsDynamic => true;

        public DatabaseLocalizationContributor(IRepository<LanguageText, Guid> languageTextRepository)
        {
            _languageTextRepository = languageTextRepository;
        }

        public void InvalidateCache()
        {
            _cachedTexts = null;
            _cachedCultures = null;
        }

        // ABP gọi khi khởi tạo contributor
        public void Initialize(LocalizationResourceInitializationContext context)
        {
            // Không làm gì — không cần ở scenario này
        }

        // Dùng để đọc 1 key cụ thể (ít dùng)
        public LocalizedString? GetOrNull(string cultureName, string name)
        {
            EnsureCacheLoaded();

            var item = _cachedTexts
                .FirstOrDefault(x =>
                    x.CultureName == cultureName &&
                    x.Key == name);

            if (item == null)
                return null;

            return new LocalizedString(name, item.Value);
        }

        // Đồng bộ hóa dữ liệu vào dictionary (ABP sẽ merge với JSON)
        public void Fill(string cultureName, Dictionary<string, LocalizedString> dictionary)
        {
            EnsureCacheLoaded();

            var texts = _cachedTexts
                .Where(x => x.CultureName == cultureName)
                .ToList();

            foreach (var t in texts)
            {
                dictionary[t.Key] = new LocalizedString(t.Key, t.Value);
            }
        }

        // Bản async (được ABP gọi trong nhiều trường hợp)
        public async Task FillAsync(string cultureName, Dictionary<string, LocalizedString> dictionary)
        {
            await EnsureCacheLoadedAsync();

            var texts = _cachedTexts
                .Where(x => x.CultureName == cultureName)
                .ToList();

            foreach (var t in texts)
            {
                dictionary[t.Key] = new LocalizedString(t.Key, t.Value);
            }
        }

        // Trả về danh sách ngôn ngữ hiện có trong DB
        public async Task<IEnumerable<string>> GetSupportedCulturesAsync()
        {
            await EnsureCacheLoadedAsync();
            return _cachedCultures;
        }

        // ====== PRIVATE HELPERS ======

        private void EnsureCacheLoaded()
        {
            //if (_cachedTexts != null)
            //    return;

            _cachedTexts = _languageTextRepository.GetListAsync().Result;
            _cachedCultures = _cachedTexts
                .Select(x => x.CultureName)
                .Distinct()
                .ToList();
        }

        private async Task EnsureCacheLoadedAsync()
        {
            //if (_cachedTexts != null)
            //    return;

            _cachedTexts = await _languageTextRepository.GetListAsync();

            _cachedCultures = _cachedTexts
                .Select(x => x.CultureName)
                .Distinct()
                .ToList();
        }
    }
}
