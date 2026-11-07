# HOA DON EX — TAMTH WEB

Ứng dụng web độc lập chạy tĩnh trên trình duyệt, triển khai được bằng GitHub Pages.

## Tính năng trong bản khởi tạo
- Nhận PDF, XML, JPG, JPEG và PNG.
- Ưu tiên đọc lớp văn bản PDF; nếu PDF scan thì chuyển sang OCR bằng Tesseract.js.
- Đọc nội dung XML; OCR hình ảnh tiếng Việt/Anh.
- Trích xuất bước đầu: mã số thuế người bán, tên đơn vị phát hành, mẫu số, ký hiệu, số hóa đơn, ngày hóa đơn và tổng tiền.
- Cho phép rà soát, hiệu chỉnh trực tiếp trên bảng.
- Xuất bảng dữ liệu Excel cho hai loại bảng kê.
- Không cần FastAPI, Python, SQLite hoặc máy chủ riêng. Dữ liệu xử lý trong phiên trình duyệt.

## Chạy bằng GitHub Pages
1. Vào **Settings → Pages**.
2. Chọn **Deploy from a branch**.
3. Branch: `main`; Folder: `/ (root)`; nhấn **Save**.
4. Sau khi GitHub Pages triển khai, mở URL Pages được hiển thị trong Settings → Pages.

## Lưu ý về độ chính xác
Bộ trích xuất hiện là nền tảng khởi tạo với quy tắc nhận dạng tổng quát, chưa thể cam kết độ chính xác 100% cho mọi mẫu hóa đơn. Mẫu hóa đơn khác nhau có cách bố trí/nhãn trường khác nhau; OCR phụ thuộc chất lượng ảnh. Người dùng phải rà soát các ô cảnh báo trước khi xuất. Không tự suy luận thông tin bị thiếu.

## Việc cần hoàn thiện tiếp theo
- Tích hợp hai file Excel mẫu nghiệp vụ thực tế để xuất đúng vị trí ô, công thức, định dạng và cấu trúc hiện hành.
- Bổ sung bộ phân tích XML hóa đơn điện tử theo các chuẩn/nhà cung cấp phổ biến, ánh xạ theo thẻ dữ liệu thay vì chỉ tìm từ khóa.
- Mở rộng nhận dạng nhiều bố cục PDF, bảng tiền, thuế suất, tổng thanh toán; có điểm tin cậy và vùng trích dẫn.
- Thêm lưu lịch sử trên IndexedDB, gộp PDF, tải ZIP và kiểm thử bằng bộ hóa đơn thật đã được đối chiếu thủ công.

## Thư viện bên thứ ba
PDF.js, Tesseract.js và ExcelJS được tải từ CDN khi có kết nối Internet. Không tải hóa đơn lên dịch vụ bên ngoài qua mã ứng dụng này.
