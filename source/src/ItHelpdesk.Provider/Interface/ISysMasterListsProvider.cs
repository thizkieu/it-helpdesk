namespace ItHelpdesk.Provider
{
    public interface ISysMasterListsProvider
    {
        Task<List<PageSysMasterListQueryResponse>> GetListAsync(SysMasterListRequest input);
        Task<InfoSysMasterListQueryResponse> GetInfoAsync(SysMasterListInfoRequest input);
        Task<List<SysMasterListQueryResponse>> GetAllCdeAsync(SysMasterListAllCdeRequest input);
        Task<int> InsertAsync(SysMasterListInsertOrUpdateRequest input);
        Task<int> UpdateAsync(SysMasterListInsertOrUpdateRequest input);
        Task<int> DeleteAsync(SysMasterListDeleteRequest input);
    }
}
