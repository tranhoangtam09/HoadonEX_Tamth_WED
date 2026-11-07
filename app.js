/* HOA DON EX — standalone browser edition */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const state = { files: [], rows: [] };
  const fields = ["taxId","issuer","template","series","number","date","amount"];
  const labels = ["Mã số thuế người bán","Đơn vị phát hành","Mẫu số","Ký hiệu","Số hóa đơn","Ngày hóa đơn","Tổng tiền"];
  if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  function setStatus(message, error=false) { $("#status").textContent = message; $("#status").style.color = error ? "#b44b42" : "#718492"; }
  function clean(v) { return String(v ?? "").replace(/\s+/g," ").trim(); }
  function normalizeDate(raw) {
    const s = clean(raw);
    let m = s.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})\b/);
    if (m) return [m[1].padStart(2,"0"),m[2].padStart(2,"0"),m[3]].join("/");
    m = s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (m) return m[3]+"/"+m[2]+"/"+m[1];
    return "";
  }
  function firstMatch(text, patterns) { for (const p of patterns) { const m=text.match(p); if(m) return clean(m[1] || m[0]); } return ""; }
  function parseText(text, name) {
    const t = text.replace(/\u00a0/g," ");
    const row = {
      file:name,
      taxId:firstMatch(t,[/(?:MST|Mã số thuế|Mã số thuế người bán)\s*[:：]?\s*([0-9-]{10,14})/i]),
      issuer:firstMatch(t,[/(?:Đơn vị bán hàng|Tên đơn vị bán hàng|Tên người bán|Tên đơn vị phát hành hóa đơn)\s*[:：]?\s*([^\n\r]{3,160})/i]),
      template:firstMatch(t,[/(?:Mẫu số|Mẫu số hóa đơn)\s*[:：]?\s*([0-9]{1,2})/i]),
      series:firstMatch(t,[/(?:Ký hiệu|Ký hiệu hóa đơn)\s*[:：]?\s*([A-Z0-9/.-]{3,20})/i]),
      number:firstMatch(t,[/(?:Số hóa đơn|Số HĐ|Số)\s*[:：]?\s*(\d{1,12})/i]),
      date:"",
      amount:firstMatch(t,[/(?:Tổng cộng tiền thanh toán|Tổng tiền thanh toán|Tổng cộng|Thành tiền)\s*[:：]?\s*([0-9., ]+\s*(?:đ|VND)?)/i])
    };
    const dateRaw=firstMatch(t,[/(?:Ngày lập hóa đơn|Ngày hóa đơn|Ngày)\s*[:：]?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4}|\d{4}-\d{2}-\d{2})/i]);
    row.date=normalizeDate(dateRaw);
    row.amount=clean(row.amount).replace(/\s*(?:đ|VND)$/i,"").trim();
    return row;
  }
  async function readPdf(file) {
    if(!window.pdfjsLib) throw new Error("Không tải được PDF.js. Kiểm tra kết nối Internet rồi tải lại trang.");
    const data=new Uint8Array(await file.arrayBuffer());
    const pdf=await pdfjsLib.getDocument({data}).promise;
    let text="";
    for(let i=1;i<=pdf.numPages;i++){
      const page=await pdf.getPage(i), content=await page.getTextContent();
      text+=content.items.map(x=>x.str).join(" ")+"\n";
    }
    if(text.replace(/\s/g,"").length>30) return text;
    if(!window.Tesseract) throw new Error("PDF có thể là bản scan nhưng thư viện OCR chưa tải được.");
    let ocr="";
    for(let i=1;i<=pdf.numPages;i++){
      const page=await pdf.getPage(i), viewport=page.getViewport({scale:1.7});
      const canvas=document.createElement("canvas"), ctx=canvas.getContext("2d");
      canvas.width=viewport.width; canvas.height=viewport.height;
      await page.render({canvasContext:ctx,viewport}).promise;
      const result=await Tesseract.recognize(canvas,"vie+eng");
      ocr+=result.data.text+"\n";
    }
    return ocr;
  }
  async function readFile(file) {
    const ext=file.name.split(".").pop().toLowerCase();
    if(ext==="xml"){
      const xml=new DOMParser().parseFromString(await file.text(),"application/xml");
      if(xml.querySelector("parsererror")) throw new Error("XML không hợp lệ.");
      return xml.documentElement.textContent || "";
    }
    if(ext==="pdf") return await readPdf(file);
    if(["jpg","jpeg","png"].includes(ext)){
      if(!window.Tesseract) throw new Error("Thư viện OCR chưa tải được.");
      const result=await Tesseract.recognize(file,"vie+eng");
      return result.data.text;
    }
    throw new Error("Định dạng chưa hỗ trợ.");
  }
  function addFiles(files) {
    for(const f of files) if(!state.files.some(x=>x.name===f.name&&x.size===f.size)) state.files.push(f);
    renderFiles();
  }
  function renderFiles() {
    $("#fileCount").textContent=state.files.length;
    $("#fileList").innerHTML=state.files.map((f,i)=>'<div class="file-item"><span>'+escapeHtml(f.name)+'</span><span>'+formatBytes(f.size)+'</span></div>').join("");
  }
  function escapeHtml(v){return String(v).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
  function formatBytes(n){return n<1024?n+" B":(n/1024).toFixed(1)+" KB";}
  function renderRows() {
    const body=$("#resultsBody");
    if(!state.rows.length){body.innerHTML='<tr><td colspan="9" class="empty">Chưa có dữ liệu.</td></tr>';return;}
    body.innerHTML=state.rows.map((r,i)=>{
      const missing=fields.filter(k=>!clean(r[k]));
      const vals=[r.taxId,r.issuer,r.template,r.series,r.number,r.date,r.amount];
      return '<tr><td>'+escapeHtml(r.file)+'</td>'+vals.map((v,j)=>'<td contenteditable="true" data-row="'+i+'" data-field="'+fields[j]+'" class="'+(!clean(v)?"needs-review":"")+'" title="Nhấp đúp để hiệu chỉnh">'+escapeHtml(v)+'</td>').join("")+'<td>'+(missing.length?'<span class="needs-review">Thiếu '+missing.length+' trường</span>':'<span style="color:#278253">Đủ trường</span>')+'</td></tr>';
    }).join("");
    body.querySelectorAll('[contenteditable=true]').forEach(td=>td.addEventListener("blur",()=>{
      const r=state.rows[Number(td.dataset.row)];r[td.dataset.field]=clean(td.textContent);
      td.classList.toggle("needs-review",!r[td.dataset.field]);
      renderRows();
    }));
  }
  async function processFiles() {
    if(!state.files.length){setStatus("Hãy chọn ít nhất một tệp.",true);return;}
    $("#processBtn").disabled=true; state.rows=[];
    try{
      for(let i=0;i<state.files.length;i++){
        const file=state.files[i]; setStatus("Đang đọc "+file.name+" ("+(i+1)+"/"+state.files.length+")…");
        try { const text=await readFile(file); state.rows.push(parseText(text,file.name)); }
        catch(e){ state.rows.push({file:file.name,error:e.message}); }
      }
      state.rows=state.rows.map(r=>r.error?{...Object.fromEntries(fields.map(k=>[k,""])),...r}:r);
      renderRows();setStatus("Đã xử lý "+state.rows.length+" tệp. Vui lòng rà soát các ô cảnh báo.");
    } finally {$("#processBtn").disabled=false;}
  }
  async function exportExcel(type) {
    if(!state.rows.length){setStatus("Chưa có dữ liệu để xuất.",true);return;}
    if(!window.ExcelJS){setStatus("Không tải được ExcelJS. Kiểm tra kết nối Internet.",true);return;}
    const wb=new ExcelJS.Workbook(), ws=wb.addWorksheet(type==="transfer"?"Chuyen khoan VND":"Bu dap VND");
    ws.addRow(["STT","Tên tệp","Mã số thuế người bán","Tên đơn vị phát hành","Mẫu số","Ký hiệu","Số hóa đơn","Ngày hóa đơn","Tổng tiền"]);
    state.rows.forEach((r,i)=>ws.addRow([i+1,r.file,r.taxId,r.issuer,r.template,r.series,r.number,r.date,r.amount]));
    ws.getRow(1).font={bold:true,color:{argb:"FFFFFFFF"}};
    ws.getRow(1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF173E5B"}};
    ws.columns=[{width:8},{width:28},{width:22},{width:38},{width:12},{width:16},{width:16},{width:16},{width:22}];
    ws.views=[{state:"frozen",ySplit:1}];ws.autoFilter={from:"A1",to:"I1"};
    const buf=await wb.xlsx.writeBuffer(), blob=new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=type==="transfer"?"Bang_ke_hoa_don_chuyen_khoan_VND.xlsx":"Bang_ke_hoa_don_bu_dap_VND.xlsx";a.click();URL.revokeObjectURL(a.href);
    setStatus("Đã tạo file Excel.");
  }
  $("#fileInput").addEventListener("change",e=>addFiles([...e.target.files]));
  $("#processBtn").addEventListener("click",processFiles);
  $("#clearBtn").addEventListener("click",()=>{state.files=[];state.rows=[];renderFiles();renderRows();setStatus("Đã xóa danh sách.");});
  document.querySelectorAll(".exportBtn").forEach(b=>b.addEventListener("click",()=>exportExcel(b.dataset.type)));
  const dz=$("#dropzone");
  ["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.style.borderColor="#287da3";}));
  ["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.style.borderColor="";}));
  dz.addEventListener("drop",e=>addFiles([...e.dataTransfer.files]));
  renderFiles();
})();