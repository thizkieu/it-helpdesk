export const DEFAULT_PAGE_INDEX = 0; // ngx-datatable dùng index bắt đầu từ 0
export const DEFAULT_PAGE_SIZE = 10; // ngx-datatable dùng size mặc định là 10
export const DEFAULT_COMMA = ',';

// #region NotificationKeys
export const NotificationKeys = {
  // ==========================================
  // NHÓM TIÊU ĐỀ (TITLES)
  // ==========================================

  // --- Tiêu đề Thêm mới ---
  /** Tiêu đề: Thông tin thêm mới */
  AddInfoTitle: '::AddInfoTitle',
  /** Tiêu đề: Thêm mới thành công */
  AddSuccessTitle: '::AddSuccessTitle',
  /** Tiêu đề: Cảnh báo thêm mới */
  AddWarningTitle: '::AddWarningTitle',
  /** Tiêu đề: Lỗi thêm mới */
  AddErrorTitle: '::AddErrorTitle',

  // --- Tiêu đề Cập nhật ---
  /** Tiêu đề: Thông tin cập nhật */
  UpdateInfoTitle: '::UpdateInfoTitle',
  /** Tiêu đề: Cập nhật thành công */
  UpdateSuccessTitle: '::UpdateSuccessTitle',
  /** Tiêu đề: Cảnh báo cập nhật */
  UpdateWarningTitle: '::UpdateWarningTitle',
  /** Tiêu đề: Lỗi cập nhật */
  UpdateErrorTitle: '::UpdateErrorTitle',

  // --- Tiêu đề Xóa ---
  /** Tiêu đề: Thông tin xóa dữ liệu */
  DeleteInfoTitle: '::DeleteInfoTitle',
  /** Tiêu đề: Xóa thành công */
  DeleteSuccessTitle: '::DeleteSuccessTitle',
  /** Tiêu đề: Cảnh báo xóa dữ liệu */
  DeleteWarningTitle: '::DeleteWarningTitle',
  /** Tiêu đề: Lỗi xóa dữ liệu */
  DeleteErrorTitle: '::DeleteErrorTitle',

  // --- Tiêu đề Điều khiển giao diện ---
  /** Tiêu đề: Hệ thống thông báo */
  ShowNotificationTitle: '::ShowNotificationTitle',
  /** Tiêu đề: Đóng thông báo */
  RemoveNotificationTitle: '::RemoveNotificationTitle',
  /** Tiêu đề: Làm sạch thông báo */
  ClearAllTitle: '::ClearAllTitle',

  // ==========================================
  // NHÓM NỘI DUNG THÔNG BÁO (MESSAGES)
  // ==========================================

  // --- NHÓM THÊM MỚI (ADD/CREATE) ---
  /** Đang xử lý thêm dữ liệu mới */
  AddInfo: '::AddInfo',
  /** Thêm mới dữ liệu thành công */
  AddSuccess: '::AddSuccess',
  /** Cảnh báo trong quá trình thêm mới */
  AddWarning: '::AddWarning',
  /** Lỗi khi thực hiện thêm mới */
  AddError: '::AddError',

  // --- NHÓM CẬP NHẬT (UPDATE/EDIT) ---
  /** Đang xử lý cập nhật dữ liệu */
  UpdateInfo: '::UpdateInfo',
  /** Cập nhật dữ liệu thành công */
  UpdateSuccess: '::UpdateSuccess',
  /** Cảnh báo trong quá trình cập nhật */
  UpdateWarning: '::UpdateWarning',
  /** Lỗi khi thực hiện cập nhật */
  UpdateError: '::UpdateError',

  // --- NHÓM XÓA (DELETE/REMOVE) ---
  /** Đang xử lý xóa dữ liệu */
  DeleteInfo: '::DeleteInfo',
  /** Xóa dữ liệu thành công */
  DeleteSuccess: '::DeleteSuccess',
  /** Cảnh báo trong quá trình xóa */
  DeleteWarning: '::DeleteWarning',
  /** Lỗi khi thực hiện xóa */
  DeleteError: '::DeleteError',

  // --- ĐIỀU KHIỂN GIAO DIỆN (UI/UX) ---
  /** Lệnh hiển thị thông báo lên màn hình */
  ShowNotification: '::ShowNotification',
  /** Lệnh gỡ bỏ một thông báo nhất định */
  RemoveNotification: '::RemoveNotification',
  /** Lệnh xóa toàn bộ danh sách thông báo */
  ClearAll: '::ClearAll',
} as const;

/** Type định danh dựa trên các key của NotificationKeys */
export type NotificationKeyType = keyof typeof NotificationKeys;
// #endregion

// #region ConfirmationKeys
export const ConfirmationKeys = {
  // ==========================================
  // NHÓM TIÊU ĐỀ (TITLES)
  // ==========================================

  // --- Xác nhận chung ---
  /** Tiêu đề: Bạn có chắc không? */
  AreYouSureTitle: '::AreYouSureTitle',

  // --- Xóa dữ liệu ---
  /** Tiêu đề: Xác nhận xóa */
  DeleteConfirmTitle: '::DeleteConfirmTitle',

  // --- Làm sạch / Reset ---
  /** Tiêu đề: Xác nhận làm sạch dữ liệu */
  ClearConfirmTitle: '::ClearConfirmTitle',

  // --- Lưu / Cập nhật ---
  /** Tiêu đề: Xác nhận lưu dữ liệu */
  SaveConfirmTitle: '::SaveConfirmTitle',
  /** Tiêu đề: Xác nhận cập nhật dữ liệu */
  UpdateConfirmTitle: '::UpdateConfirmTitle',

  // --- Gửi / Submit ---
  /** Tiêu đề: Xác nhận gửi dữ liệu */
  SubmitConfirmTitle: '::SubmitConfirmTitle',

  // --- Thoát / Điều hướng ---
  /** Tiêu đề: Thoát khi chưa lưu */
  ExitWithoutSaveTitle: '::ExitWithoutSaveTitle',

  // --- Đăng xuất ---
  /** Tiêu đề: Xác nhận đăng xuất */
  LogoutConfirmTitle: '::LogoutConfirmTitle',

  // --- Thành công / Tiếp tục ---
  /** Tiêu đề: Thao tác thành công */
  SuccessConfirmTitle: '::SuccessConfirmTitle',

  // --- Lỗi / Thử lại ---
  /** Tiêu đề: Thao tác thất bại */
  ErrorConfirmTitle: '::ErrorConfirmTitle',

  // --- Hiển thị thông tin ---
  /** Tiêu đề: Xem thông tin */
  ShowInfoTitle: '::ShowInfoTitle',

  // ==========================================
  // NHÓM NỘI DUNG XÁC NHẬN (MESSAGES)
  // ==========================================

  // --- Xác nhận chung ---
  /** Nội dung: Bạn có chắc chắn muốn thực hiện thao tác này không? */
  AreYouSureMessage: '::AreYouSureMessage',

  // --- Xóa dữ liệu ---
  /** Nội dung: Xác nhận xóa dữ liệu */
  DeleteConfirmMessage: '::DeleteConfirmMessage',

  // --- Làm sạch / Reset ---
  /** Nội dung: Làm sạch toàn bộ dữ liệu đã nhập */
  ClearConfirmMessage: '::ClearConfirmMessage',

  // --- Lưu / Cập nhật ---
  /** Nội dung: Xác nhận lưu dữ liệu */
  SaveConfirmMessage: '::SaveConfirmMessage',
  /** Nội dung: Xác nhận cập nhật dữ liệu */
  UpdateConfirmMessage: '::UpdateConfirmMessage',

  // --- Gửi / Submit ---
  /** Nội dung: Xác nhận gửi dữ liệu */
  SubmitConfirmMessage: '::SubmitConfirmMessage',

  // --- Thoát / Điều hướng ---
  /** Nội dung: Thoát khi chưa lưu thay đổi */
  ExitWithoutSaveMessage: '::ExitWithoutSaveMessage',

  // --- Đăng xuất ---
  /** Nội dung: Xác nhận đăng xuất khỏi hệ thống */
  LogoutConfirmMessage: '::LogoutConfirmMessage',

  // --- Thành công / Tiếp tục ---
  /** Nội dung: Thao tác thành công, bạn có muốn tiếp tục không? */
  SuccessConfirmMessage: '::SuccessConfirmMessage',

  // --- Lỗi / Thử lại ---
  /** Nội dung: Có lỗi xảy ra, bạn có muốn thử lại không? */
  ErrorConfirmMessage: '::ErrorConfirmMessage',

  // --- Hiển thị thông tin ---
  /** Nội dung: Bạn có muốn xem thông tin chi tiết không? */
  ShowInfoMessage: '::ShowInfoMessage',
} as const;

/** Type định danh dựa trên các key của ConfirmationKeys */
export type ConfirmationKeyType = keyof typeof ConfirmationKeys;
// #endregion
