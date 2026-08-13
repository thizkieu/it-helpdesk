using ItHelpdesk.LocalizationManagement.Languages;

namespace ItHelpdesk.Provider
{
    public interface ILanguagesProvider
    {
        Task<List<LanguageQueryResponse>> GetLanguagessAsync(LanguageRequest input);
    }
}
