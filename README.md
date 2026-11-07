# HOA DON EX PRO — TAMTH WEB

Ứng dụng độc lập chạy trên trình duyệt và có thể triển khai bằng GitHub Pages. Không cần FastAPI, Python, SQLite hoặc máy chủ riêng.

## Đã triển khai
- Nhận nhiều hóa đơn PDF, XML, JPG, JPEG, PNG, WEBP và TIFF.
- Ưu tiên đọc lớp văn bản PDF; PDF scan chuyển sang OCR Tesseract.js tiếng Việt/Anh.
- Đọc XML và ánh xạ một số trường hóa đơn điện tử phổ biến (MST, người bán/người mua, ký hiệu, số hóa đơn, ngày, tổng tiền); XML khác chuẩn cần bổ sung bộ ánh xạ.
- Trích xuất gợi ý: MST và tên người bán/người mua, mẫu số, ký hiệu, số hóa đơn, ngày, tổng tiền, loại tiền, mô tả hàng hóa.
- Bảng dữ liệu có thể chỉnh sửa, lọc trạng thái, xóa từng hồ sơ, xóa hồ sơ không nhận dạng và xóa lô.
- Lô mới chỉ thay thế lô cũ nếu có ít nhất một tệp đọc thành công; nếu cả lô lỗi, dữ liệu cũ được giữ lại.
- Nạp trực tiếp workbook Excel mẫu gốc do người dùng chọn và xuất theo đúng sheet bảng kê, giữ sheet hướng dẫn và kiểu định dạng của workbook.
- Dữ liệu thiếu vẫn được phép xuất; ô tương ứng để trống, không tự tạo hoặc suy đoán.

## Bắt đầu sử dụng
1. Mở ứng dụng sau khi GitHub Pages đã được bật.
2. Tải hóa đơn lên và nhấn **Phân tích lô hóa đơn**.
3. Kiểm tra và hiệu chỉnh từng trường trong bảng.
4. Tải lên file mẫu gốc ở mục **Quản lý biểu mẫu Excel gốc**:
   - Chuyển khoản: sheet `Bảng kê hóa đơn`, 12 cột.
   - Bù đắp: sheet `Bảng kê hóa đơn GN bù đắp`, 13 cột.
5. Nhấn nút xuất tương ứng.

## Quy tắc ánh xạ dữ liệu Excel
**Chuyển khoản VND:** STT; MST người mua/thụ hưởng; tên người mua/thụ hưởng; số tài khoản; ký hiệu mẫu; ký hiệu hóa đơn; số hóa đơn; ngày hóa đơn; số tiền hóa đơn; loại tiền; mặt hàng/mục đích; số tiền nhận nợ.

**Bù đắp VND:** STT; MST người bán; tên đơn vị phát hành; ký hiệu mẫu; ký hiệu hóa đơn; số hóa đơn; ngày hóa đơn; số tiền hóa đơn; loại tiền; mặt hàng/mục đích; số tiền nhận nợ; ngày thanh toán; số tiền đã thanh toán.

Thông tin số tài khoản, số tiền nhận nợ và dữ liệu thanh toán là dữ liệu nghiệp vụ cần người dùng nhập/duyệt; ứng dụng không suy ra từ hóa đơn.

## GitHub Pages
Vào **Settings → Pages**, chọn **Deploy from a branch**, branch `main`, folder `/ (root)`, rồi Save. Workflow trong `.github/workflows/pages.yml` cũng được cấu hình để triển khai Pages khi push lên `main`.

## Giới hạn và kiểm soát
- Không thể cam kết OCR chính xác 100%. Chất lượng ảnh, font, bố cục và chuẩn XML khác nhau; phải đối chiếu hóa đơn gốc.
- Bộ XML hiện là ánh xạ nền tảng, không phải bộ giải mã đã chứng nhận cho mọi nhà cung cấp hóa đơn điện tử.
- ExcelJS đọc/ghi workbook trong trình duyệt; cần kiểm tra các tính năng Excel đặc biệt sau xuất (ví dụ macro, đối tượng nhúng, một số tính năng riêng của nhà cung cấp).
- File mẫu được chọn trong phiên trình duyệt; tải lại trang cần chọn lại mẫu.
- PDF.js, Tesseract.js và ExcelJS tải từ CDN, cần kết nối Internet. Hóa đơn được xử lý trong trình duyệt, mã ứng dụng không tự gửi tệp lên máy chủ.
- Chưa triển khai gộp PDF, ZIP, lưu lịch sử đa thiết bị hoặc đồng bộ dữ liệu nhiều người dùng.

## Công nghệ
HTML, CSS, JavaScript, PDF.js, Tesseract.js, ExcelJS, GitHub Pages.

## Đối chiếu bộ hóa đơn kiểm thử người dùng cung cấp
Đã phân tích nội dung và bố cục 6 PDF thuộc 3 kiểu mẫu: MISA–Long Sinh, MISA–Ngọc Trai (hóa đơn 2 trang), FAST–Dầu khí Đồng Tháp. Các giá trị đối chiếu chuẩn:

| Tệp / số hóa đơn | MST đơn vị phát hành | Ký hiệu | Ngày | Tổng thanh toán (VND) |
|---|---:|---|---|---:|
| 1C26TLS / 00004376 | 4200286988 | 1C26TLS | 07/09/2026 | 155280000 |
| 1C26TLS / 00004467 | 4200286988 | 1C26TLS | 11/09/2026 | 8112000 |
| 1C26TNT / 00000952 | 4200410988-001 | 1C26TNT | 23/06/2026 | 180777500 |
| 1K26TKD / 16239 | 1400147351 | 1K26TKD | 06/10/2026 | 160980000 |
| 1K26TKD / 16460 | 1400147351 | 1K26TKD | 09/10/2026 | 169320000 |
| 1K26TKD / 16573 | 1400147351 | 1K26TKD | 14/10/2026 | 165720000 |

MST người mua của hai nhóm Long Sinh và Ngọc Trai là 1900563381; nhóm FAST là 1900325771. Bộ kiểm thử cho thấy các trường hợp cần xử lý riêng: MST nằm trước nhãn “Mã số thuế” trong thứ tự text PDF; MST chi nhánh khác MST công ty mẹ; ký hiệu/số hóa đơn/ngày/tổng tiền có thể bị đảo thứ tự khi trích xuất text; tổng thanh toán phải lấy sau thuế (ví dụ hóa đơn Long Sinh 00004467 là 8.112.000, không phải tiền hàng 7.725.714).

Parser đã được tăng cường để:
- Tách vùng người bán và người mua trước khi lấy MST, tránh lấy nhầm MST phần mềm MISA hoặc MST bên mua.
- Chuẩn hóa MST có dấu cách, giữ hậu tố chi nhánh dạng `-001`.
- Nhận dạng ngày dạng “Ngày 07 tháng 09 năm 2026” và thứ tự text bị đảo.
- Lấy tổng thanh toán, không nhầm với cộng tiền hàng hoặc tiền thuế.
- Nhận dạng ký hiệu/số hóa đơn kể cả khi PDF trích xuất nhãn và giá trị theo thứ tự ngược.
- Dùng chữ số đầu của ký hiệu làm gợi ý “Ký hiệu mẫu số”; cần rà soát theo mẫu biểu và loại hóa đơn thực tế.

**Lưu ý:** Bảng trên là dữ liệu chuẩn đối chiếu đọc từ các PDF gốc, không phải tuyên bố rằng ứng dụng đã tự động vượt qua kiểm thử toàn bộ. Cần tải các PDF lên bản GitHub Pages sau cập nhật và so sánh kết quả từng trường. Nếu trường nào sai, chỉnh sửa trực tiếp trên bảng trước khi xuất.


## Nâng cấp độ chính xác — Accuracy pipeline
- XML parser được đưa vào luồng đọc thực tế; chuẩn hóa tên thẻ XML theo local-name và hỗ trợ thêm các alias trường thường gặp.
- PDF Text được ưu tiên; PDF scan hoặc PDF có trường còn thiếu sẽ được OCR tăng cường nhiều trang.
- Quét QR trên tối đa 3 trang đầu của PDF và ảnh; dữ liệu QR chỉ được dùng để bổ sung trường còn trống, không âm thầm ghi đè dữ liệu mâu thuẫn.
- Nếu QR và PDF khác nhau, ứng dụng hiển thị cảnh báo để người dùng xác minh.
- Mỗi hồ sơ có phần mở rộng xem nguồn văn bản trích xuất và chế độ nhận dạng.
- Điểm đánh giá được tính lại có xét nguồn XML/PDF/OCR và cảnh báo; đây là điểm kiểm tra nội bộ, không phải xác suất chính xác được hiệu chuẩn.
- Xuất Excel yêu cầu các trường cốt lõi theo loại biểu mẫu, không có hóa đơn trùng hoặc cảnh báo trọng yếu; người dùng phải xác nhận đã đối chiếu bản gốc.
- QR decode dùng thư viện jsQR qua CDN. Ứng dụng vẫn chạy nếu không tải được thư viện, nhưng sẽ không có dữ liệu QR.

**Giới hạn kiểm thử:** Chưa thể xác nhận độ chính xác đầu-cuối của OCR/QR trên mọi hóa đơn chỉ bằng kiểm tra mã nguồn. Cần chạy bộ PDF/XML thực tế trên GitHub Pages và so sánh từng trường với dữ liệu chuẩn trước khi sử dụng nghiệp vụ.


## Chức năng bổ sung: xuất Excel linh hoạt và gộp PDF
- Mặc định xuất Excel ở chế độ linh hoạt: không bắt buộc đủ tất cả trường; dữ liệu thiếu được để trống, không tự suy đoán.
- Có thể bật tùy chọn “Kiểm tra nghiêm ngặt” để chặn xuất khi thiếu trường cốt lõi, có hóa đơn trùng hoặc cảnh báo trọng yếu.
- Gộp tối đa 10 tệp PDF/JPG/JPEG/PNG/WEBP thành một PDF; người dùng chọn tệp từ máy tính, xóa tệp khỏi danh sách và đổi thứ tự trước khi gộp.
- PDF nhiều trang được giữ nguyên; mỗi ảnh được chuyển thành một trang PDF. Dùng pdf-lib trên trình duyệt, không tải tệp lên máy chủ.
- Cần Internet để tải thư viện pdf-lib từ CDN. PDF có mật khẩu/mã hóa hoặc bị lỗi có thể không gộp được.
