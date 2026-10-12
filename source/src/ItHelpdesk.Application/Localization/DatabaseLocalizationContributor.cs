using ItHelpdesk.LocalizationManagement.LanguageTexts;
using Microsoft.Extensions.Localization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Localization;

namespace ItHelpdesk.Localization
{
    public class DatabaseLocalizationContributor : ILocalizationResourceContributor
    {
        private readonly IRepository<LanguageText, Guid> _languageTextRepository;
        private List<LanguageText>? _cachedTexts;
        private List<string>? _cachedCultures;

        // BỔ SUNG: Khóa luồng an toàn (Thread-safe)
        private static readonly object _syncObj = new object();
        private static readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

        public bool IsDynamic => true;

        public DatabaseLocalizationContributor(IRepository<LanguageText, Guid> languageTextRepository)
        {
            _languageTextRepository = languageTextRepository;
        }

        public void InvalidateCache()
        {
            // Khóa lại trước khi reset để tránh xung đột
            lock (_syncObj)
            {
                _cachedTexts = null;
                _cachedCultures = null;
            }
        }

        public void Initialize(LocalizationResourceInitializationContext context) { }

        public LocalizedString? GetOrNull(string cultureName, string name)
        {
            EnsureCacheLoaded();
            if (_cachedTexts == null) return null;

            var item = _cachedTexts.FirstOrDefault(x => x.CultureName == cultureName && x.Key == name);
            if (item == null) return null;

            return new LocalizedString(name, item.Value);
        }

        public void Fill(string cultureName, Dictionary<string, LocalizedString> dictionary)
        {
            EnsureCacheLoaded();
            if (_cachedTexts == null) return;

            var texts = _cachedTexts.Where(x => x.CultureName == cultureName).ToList();
            foreach (var t in texts)
            {
                dictionary[t.Key] = new LocalizedString(t.Key, t.Value);
            }
        }

        public async Task FillAsync(string cultureName, Dictionary<string, LocalizedString> dictionary)
        {
            await EnsureCacheLoadedAsync();
            if (_cachedTexts == null) return;

            var texts = _cachedTexts.Where(x => x.CultureName == cultureName).ToList();
            foreach (var t in texts)
            {
                dictionary[t.Key] = new LocalizedString(t.Key, t.Value);
            }
        }

        public async Task<IEnumerable<string>> GetSupportedCulturesAsync()
        {
            await EnsureCacheLoadedAsync();
            return _cachedCultures ?? new List<string>();
        }

        // ====== BỔ SUNG THREAD-SAFE CHO HELPERS ======

        private void EnsureCacheLoaded()
        {
            if (_cachedTexts != null) return;

            lock (_syncObj)
            {
                if (_cachedTexts != null) return;

                _cachedTexts = _languageTextRepository.GetListAsync().GetAwaiter().GetResult();
                _cachedCultures = _cachedTexts.Select(x => x.CultureName).Distinct().ToList();
            }
        }

        private async Task EnsureCacheLoadedAsync()
        {
            if (_cachedTexts != null) return;

            await _semaphore.WaitAsync();
            try
            {
                if (_cachedTexts != null) return;

                _cachedTexts = await _languageTextRepository.GetListAsync();
                _cachedCultures = _cachedTexts.Select(x => x.CultureName).Distinct().ToList();
            }
            finally
            {
                _semaphore.Release();
            }
        }
    }
}