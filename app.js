/* HOA DON EX PRO — standalone browser edition */
(()=>{'use strict';
const $=s=>document.querySelector(s),state={files:[],rows:[],templates:{transfer:null,offset:null}};
if(window.pdfjsLib)pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const fields=['sellerTax','seller','buyerTax','buyer','formCode','series','number','date','amount','currency','item','account','debtAmount','paidDate','paidAmount'];
const labels=['MST người bán','Đơn vị phát hành','MST người mua/thụ hưởng','Tên người mua/thụ hưởng','Mẫu số','Ký hiệu HĐ','Số hóa đơn','Ngày hóa đơn','Tổng tiền','Loại tiền','Mặt hàng/Mục đích','Số tài khoản','Số tiền nhận nợ','Ngày thanh toán','Đã thanh toán'];
const clean=v=>String(v??'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const status=s=>$('#status').textContent=s;
function first(t,rs){for(const r of rs){const m=t.match(r);if(m&&m[1])return clean(m[1]);}return '';}
function normalizeTax(s){const v=clean(s).replace(/[ .]/g,'');return /^(?:\d{10}|\d{12}|\d{10}-\d{3})$/.test(v)?v:'';}
function taxFrom(block){const s=String(block||'');let m=s.match(/([0-9][0-9 .-]{8,22})\s*(?:Mã\s*số\s*thuế|MST|Tax\s*code)/i);if(!m)m=s.match(/(?:Mã\s*số\s*thuế|MST|Tax\s*code)\s*[:：]?\s*([0-9][0-9 .-]{8,22})/i);return m?normalizeTax(m[1]):'';}
function dateNorm(s){s=clean(s);let m=s.match(/\b(\d{1,2})[/. \-](\d{1,2})[/. \-](\d{4})\b/);if(m)return m[1].padStart(2,'0')+'/'+m[2].padStart(2,'0')+'/'+m[3];m=s.match(/\b(\d{1,2})\s+tháng\s+(\d{1,2})(?:\s+năm)?\s+(\d{4})/i);if(m)return m[1].padStart(2,'0')+'/'+m[2].padStart(2,'0')+'/'+m[3];m=s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);return m?m[3]+'/'+m[2]+'/'+m[1]:'';}
function money(s){s=clean(s).replace(/[^\d.,-]/g,'');if(!s)return '';if(s.includes('.')&&s.includes(',')){s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');}else if(s.includes(',')){const a=s.split(',');s=a[a.length-1].length<=2?a.slice(0,-1).join('')+'.'+a[a.length-1]:a.join('');}else if((s.match(/\./g)||[]).length>1)s=s.replace(/\./g,'');return s;}
function valueAfterLabel(lines,labelRx,max=3){const i=lines.findIndex(x=>labelRx.test(x));if(i<0)return '';let v=lines[i].replace(labelRx,'').replace(/^[:：\s]+/,'').trim();if(v)return v;for(let j=i+1;j<Math.min(lines.length,i+1+max);j++){const q=lines[j].trim();if(!q||/^(?:Mã số thuế|MST|Địa chỉ|Hình thức thanh toán|Ký hiệu|Số\s*:)/i.test(q))continue;return q;}return '';}
function extractItem(t){const lines=t.split(/\n/).map(x=>clean(x)).filter(Boolean);const h=lines.findIndex(x=>/Tên hàng hóa|TÊN HÀNG HÓA|Name of goods/i.test(x));if(h<0)return '';const end=lines.findIndex((x,i)=>i>h&&/(?:Cộng tiền hàng|Tổng tiền thanh toán|Tổng cộng tiền thanh toán|Thuế suất GTGT)/i.test(x));const area=lines.slice(h+1,end<0?Math.min(lines.length,h+18):end);const out=[];for(const line of area){if(/^(?:A\s+B|STT|Đơn vị tính|ĐVT|B\s+C|No\s+Name)/i.test(line))continue;if(/^\d{1,3}\s+/.test(line)){let v=line.replace(/^\d{1,3}\s+/,'');v=v.replace(/\s+(?:kg|Kg|KG|LON|Lon|Chai|chai|Lít|Lit|lon)\s+[\d.,]+\s+[\d.,]+\s+[\d.,]+.*$/,'');v=v.replace(/\s+[\d.,]{4,}\s+[\d.,]{4,}\s+[\d.,]{4,}$/,'');if(v)out.push(v);}else if(out.length&&!/^(?:Thuế|KCT|KKKNT|Tổng|Cộng|Người mua|Người bán|\(?Đơn đặt hàng)/i.test(line)&&! /^(?:kg|KG|Kg|LON|Lon|Chai|chai|Lít|Lit|lon|[\d.,]+)$/i.test(line)&&!/[0-9]{4,}/.test(line)&&out[out.length-1].length<250)out[out.length-1]+=' '+line;}return clean(out.join('; ')).slice(0,500);}
function parseTextLegacy(t,file){t=String(t||'').replace(/\r/g,'\n').replace(/\u00a0/g,' ');const lines=t.split('\n').map(x=>x.replace(/[ \t]+/g,' ').trim()).filter(Boolean);
const sellerLabel=lines.findIndex(x=>/(?:Đơn vị bán hàng|Tên người bán|Seller name)/i.test(x));
const buyerLabel=lines.findIndex(x=>/(?:Họ tên người mua hàng|Thông tin người mua|Buyer)/i.test(x));
const sellerEnd=buyerLabel>sellerLabel&&sellerLabel>=0?buyerLabel:Math.min(lines.length,Math.max(0,sellerLabel)+18);
const sellerBlock=sellerLabel>=0?lines.slice(sellerLabel,sellerEnd).join('\n'):lines.slice(0,Math.min(lines.length,18)).join('\n');
const buyerBlock=buyerLabel>=0?lines.slice(buyerLabel).join('\n'):lines.slice(Math.max(0,lines.findIndex(x=>/^Tên đơn vị\s*[:：]?/i.test(x)))).join('\n');
let sellerTax=taxFrom(sellerBlock);if(!sellerTax&&sellerLabel<0)sellerTax=taxFrom(lines.slice(0,Math.min(lines.length,12)).join('\n'));
let buyerTax=taxFrom(buyerBlock);
let seller=valueAfterLabel(lines,/(?:Đơn vị bán hàng|Tên người bán|Seller name)\s*[:：]?/i,3);
if(seller){const si=lines.findIndex(x=>/(?:Đơn vị bán hàng|Tên người bán|Seller name)/i.test(x));if(si>=0){const inline=lines[si].replace(/.*?(?:Đơn vị bán hàng|Tên người bán|Seller name)\s*[:：]?/i,'').trim();if(!inline&&lines[si+1]&&!/(?:Mã số thuế|MST|Địa chỉ)/i.test(lines[si+1]))seller=lines[si+1];const next=lines[si+1]&&inline?lines[si+1]:lines[si+2];if(next&&!/(?:Mã số thuế|MST|Địa chỉ)/i.test(next)&&next!==seller&&seller.length<150&&/^[A-ZÀ-Ỹ0-9 -]+$/.test(next))seller+=' '+next;}}
if(!seller){seller=lines.find(x=>/^(?:CÔNG TY|CHI NHÁNH CÔNG TY|DOANH NGHIỆP)/i.test(x))||'';if(seller&&/CHI NHÁNH/i.test(seller)){const si=lines.indexOf(seller);if(lines[si+1]&&!/(?:Mã số thuế|MST|Địa chỉ)/i.test(lines[si+1]))seller+=' '+lines[si+1];}}
let buyer=valueAfterLabel(lines,/(?:Tên đơn vị|Tên công ty|Company'?s name)\s*[:：]?/i,2);
if(!buyer&&buyerLabel>=0)buyer=valueAfterLabel(lines.slice(buyerLabel),/(?:Tên đơn vị|Tên công ty|Company'?s name)\s*[:：]?/i,2);
const series=first(t,[/(?:Ký hiệu\s*(?:\(Sign\))?|Ký hiệu hóa đơn)\s*[:：]?\s*([0-9A-Z]{1,3}[A-Z0-9]{2,15})/i,/([0-9A-Z]{4,20})\s*(?:Ký hiệu\s*(?:\(Sign\))?|Ký hiệu hóa đơn)/i]);
const number=first(t,[/(?:Số hóa đơn|Số\s*(?:\(No\))?|Invoice\s*No\.?)\s*[:：]?\s*([0-9]{3,25})/i,/([0-9]{3,25})\s*(?:\(No\)|Số\s*[:：])/i]);
const rawDate=first(t,[/(?:Ngày(?:\s*\(Date\))?)\s*[:：]?\s*(\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+\d{4}|\d{1,2}[/. -]\d{1,2}[/. -]\d{4})/i,/\b(\d{1,2}\s+tháng\s+\d{1,2}\s+(?:năm\s+)?\d{4})\s*Ngày?\b/i]);
const total=first(t,[/(?:Tổng\s*(?:cộng\s*)?tiền\s*thanh\s*toán|III\.\s*Tổng cộng tiền thanh toán|Total amount)\s*[:：]?\s*([0-9][0-9., ]{2,})/i,/([0-9][0-9., ]{2,})\s*(?:Tổng\s*(?:cộng\s*)?tiền\s*thanh\s*toán|Total amount)/i]);
const formCode=series?series.match(/^\d/)?.[0]||'':'';
const item=extractItem(t);
return {file,sellerTax,seller:clean(seller),buyerTax,buyer:clean(buyer),formCode,series,number,date:dateNorm(rawDate),amount:money(total),currency:'VND',item,account:'',debtAmount:'',paidDate:'',paidAmount:'',raw:t};
}

// Multi-stage recognition: template-aware extraction + OCR fallback + confidence checks.
function parseText(t,file){
 const raw=String(t||'').replace(/\u00a0/g,' ').replace(/\r/g,'\n');
 const lines=raw.split('\n').map(x=>x.replace(/[ \t]+/g,' ').trim()).filter(Boolean);
 const cleanLine=x=>String(x||'').replace(/\s+/g,' ').trim();
 const taxNorm=x=>{const z=String(x||'').replace(/[ .]/g,'').trim();return /^(?:\d{10}|\d{12}|\d{10}-\d{3})$/.test(z)?z:'';};
 const taxAtLabel=(start,end)=>{
  for(let i=Math.max(0,start);i<Math.min(lines.length,end);i++){
   if(!/(?:Mã\s*số\s*thuế|MST|Tax\s*code)/i.test(lines[i]))continue;
   const candidates=[lines[i].replace(/.*?(?:Mã\s*số\s*thuế|MST|Tax\s*code)\s*[:：]?/i,''),lines[i+1]||'',lines[i-1]||''];
   for(const c of candidates){const m=c.match(/\b\d[\d .-]{8,22}\b/);if(m){const v=taxNorm(m[0]);if(v&&v!=='0101243150'&&v!=='0100109106')return v;}}
  }
  return '';
 };
 const sellerIdx=lines.findIndex(x=>/(?:Đơn vị bán hàng|Tên người bán|Seller name)\s*[:：]?/i.test(x));
 const buyerNameIdx=lines.findIndex(x=>/^(?:Tên khách hàng|Tên đơn vị|Tên công ty|Company'?s name)\s*[:：]?/i.test(x));
 const buyerPersonIdx=lines.findIndex(x=>/Họ tên người mua hàng/i.test(x));
 const buyerStart=buyerNameIdx>=0?buyerNameIdx:(buyerPersonIdx>=0?buyerPersonIdx:-1);
 let sellerTax='',seller='';
 if(sellerIdx>=0){
  const sellerEnd=buyerStart>sellerIdx?buyerStart:Math.min(lines.length,sellerIdx+25);
  sellerTax=taxAtLabel(sellerIdx,sellerEnd);
  let name=lines[sellerIdx].replace(/.*?(?:Đơn vị bán hàng|Tên người bán|Seller name)\s*[:：]?/i,'').trim();
  const parts=name?[name]:[];
  for(let j=sellerIdx+1;j<sellerEnd&&j<sellerIdx+5;j++){
   const q=lines[j];if(/(?:Mã\s*số\s*thuế|MST|Tax\s*code|Địa chỉ|Address|Số tài khoản)/i.test(q))break;
   if(q&&!/^\d/.test(q)&&!/^HÓA ĐƠN/i.test(q))parts.push(q);
  }
  seller=cleanLine(parts.join(' '));
 }else{
  // Vendor templates without a "Đơn vị bán hàng" label: use the first issuer identity block.
  const firstTaxLine=lines.findIndex(x=>/(?:Mã\s*số\s*thuế|MST|Tax\s*code)/i.test(x));
  if(firstTaxLine>=0){
   sellerTax=taxAtLabel(0,Math.min(lines.length,firstTaxLine+4));
   for(let j=firstTaxLine-1;j>=Math.max(0,firstTaxLine-5);j--){
    if(/^(?:CÔNG TY|DOANH NGHIỆP|HỘ KINH DOANH|NGUYỄN THỊ|ĐẶNG VĂN)/i.test(lines[j])){seller=lines[j];break;}
   }
  }
 }
 let buyer='',buyerTax='';
 if(buyerNameIdx>=0){
  const label=lines[buyerNameIdx];
  buyer=label.replace(/^(?:Tên khách hàng|Tên đơn vị|Tên công ty|Company'?s name)\s*[:：]?\s*/i,'').trim();
  if(!buyer){for(let j=buyerNameIdx+1;j<Math.min(lines.length,buyerNameIdx+4);j++){if(/(?:Mã\s*số\s*thuế|MST|Địa chỉ|Address)/i.test(lines[j]))break;if(lines[j]){buyer=lines[j];break;}}}
  const buyerEnd=Math.min(lines.length,buyerNameIdx+12);
  buyerTax=taxAtLabel(buyerNameIdx,buyerEnd);
 }else if(buyerPersonIdx>=0){
  buyerTax=taxAtLabel(buyerPersonIdx,Math.min(lines.length,buyerPersonIdx+15));
 }
 const fullSeries=first(raw,[/(?:Ký hiệu\s*(?:\(Sign\))?|Ký hiệu hóa đơn)\s*[:：]?\s*([0-9A-Z]{4,18})/i]);
 // Theo mẫu Excel: mẫu số là ký tự đầu tiên (ví dụ 1); ký hiệu hóa đơn là phần còn lại (K26TKD).
 const formCode=fullSeries&&/^\d[A-Z0-9]{3,17}$/i.test(fullSeries)?fullSeries.slice(0,1):'';
 const series=fullSeries&&formCode?fullSeries.slice(1):fullSeries;
 // Invoice number is the digit sequence printed BELOW the invoice series.
 // Only inspect text AFTER the series label/value; never search the address/header before it.
 // This prevents house number (e.g. 472 Nguyễn Huệ), phone, account and PO numbers
 // from being mistaken for the invoice number.
 let number='';
 if(series){
  const pos=raw.toUpperCase().indexOf(series.toUpperCase());
  if(pos>=0){
   const below=raw.slice(pos+series.length,pos+Math.min(260,raw.length-pos));
   const rows=below.split(/\n+/).map(x=>x.replace(/[ \t]+/g,' ').trim()).filter(Boolean);
   for(let i=0;i<Math.min(rows.length,6);i++){
    // Explicit "Số:" label below the series; value may be on the same or next extracted line.
    const label=rows[i].match(/^Số\s*(?:\(No\))?\s*[:：]?\s*(.*)$/i);
    if(!label)continue;
    const same=label[1].match(/^([0-9]{3,25})\b/);
    if(same){number=same[1];break;}
    for(let j=i+1;j<Math.min(rows.length,i+3);j++){
     const next=rows[j].match(/^([0-9]{3,25})\s*$/);
     if(next){number=next[1];break;}
     // Stop if another field label intervenes; do not roam into body/address/order details.
     if(/^(?:Ngày|Date|Mã|Địa chỉ|Tên|Họ tên|Hình thức|STT|Đơn vị|Ký bởi)/i.test(rows[j]))break;
    }
    if(number)break;
   }
   // Some PDF text layers place "Ký hiệu" and "Số" on the same line.
   if(!number){
    const sameLine=below.match(/(?:^|\s)Số\s*(?:\(No\))?\s*[:：]\s*([0-9]{3,25})\b/i);
    if(sameLine)number=sameLine[1];
   }
  }
 }
 const orderNumber=first(raw,[/(?:Đơn\s*đặt\s*hàng|Purchase\s*order|PO\s*No\.?)\s*[:：]?\s*([A-Z0-9/-]{2,30})/i]);
 const dateRaw=first(raw,[/(?:Ngày(?:\s*\(Date\))?)\s*[:：]?\s*(\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+\d{4}|\d{1,2}[/. -]\d{1,2}[/. -]\d{4})/i]);
 let amount='';
 const totalLabel=/(?:Tổng\s*(?:cộng\s*)?tiền\s*thanh\s*toán|Total\s*(?:payment|amount))/i;
 for(let i=0;i<lines.length;i++)if(totalLabel.test(lines[i])){
  const candidates=[lines[i].replace(totalLabel,''),lines[i+1]||'',lines[i+2]||''];
  for(const c of candidates){const m=c.match(/\b\d[\d., ]{2,}\b/);if(m){const v=money(m[0]);if(v&&Number(v)>0){amount=v;break;}}}
  if(amount)break;
 }
 // Only sales invoices may use the labeled gross sales amount as a fallback.
 if(!amount&&/HÓA ĐƠN BÁN HÀNG/i.test(raw)){
  for(let i=0;i<lines.length;i++)if(/Cộng tiền hàng hóa, dịch vụ/i.test(lines[i])){
   const m=(lines[i]+' '+(lines[i+1]||'')).match(/\b\d[\d., ]{2,}\b/);if(m)amount=money(m[0]);
  }
 }
 const item=extractItem(raw);
 const r={file,sellerTax,seller:cleanLine(seller),buyerTax,buyer:cleanLine(buyer),formCode,series,number,orderNumber,date:dateNorm(dateRaw),amount,currency:'VND',item,account:'',debtAmount:'',paidDate:'',paidAmount:'',raw,sourceText:raw};
 r.checks=validateInvoice(r);r.confidence=confidenceScore(r);return r;
}
function validateInvoice(r){
 const warnings=[];
 if(!r.sellerTax)warnings.push('Thiếu MST người bán');
 if(!r.seller)warnings.push('Thiếu tên người bán');
 if(!r.buyerTax)warnings.push('Thiếu MST người mua');
 if(!r.series)warnings.push('Thiếu ký hiệu hóa đơn');
 if(!r.number)warnings.push('Thiếu số hóa đơn');
 if(!r.date)warnings.push('Thiếu ngày hóa đơn');
 if(!r.amount)warnings.push('Thiếu tổng thanh toán');
 if(r.sellerTax && r.buyerTax && r.sellerTax===r.buyerTax)warnings.push('MST người bán trùng MST người mua');
 if(r.amount && (!Number.isFinite(Number(r.amount)) || Number(r.amount)<=0))warnings.push('Tổng thanh toán không hợp lệ');
 if(r.date){const m=r.date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(!m||+m[1]>31||+m[2]>12||+m[1]<1||+m[2]<1)warnings.push('Ngày hóa đơn cần kiểm tra');}
 return warnings;
}
function confidenceScore(r){
 const required=['sellerTax','seller','buyerTax','buyer','series','number','date','amount'];
 const got=required.filter(k=>String(r[k]||'').trim()).length;
 let score=Math.round(got/required.length*85);
 if(r.amount&&Number(r.amount)>0)score+=5;
 if(r.date&&/^\d{2}\/\d{2}\/\d{4}$/.test(r.date))score+=5;
 if(r.sellerTax&&/^(?:\d{10}|\d{12}|\d{10}-\d{3})$/.test(r.sellerTax))score+=5;
 return Math.min(100,score);
}
function makeCanvas(source,scale=2.6,enhance=true){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(source.width&&source.height){canvas.width=Math.round(source.width*scale);canvas.height=Math.round(source.height*scale);ctx.drawImage(source,0,0,canvas.width,canvas.height);}
 else {canvas.width=source.width;canvas.height=source.height;ctx.drawImage(source,0,0);}
 if(enhance){const im=ctx.getImageData(0,0,canvas.width,canvas.height),d=im.data;for(let p=0;p<d.length;p+=4){let y=.299*d[p]+.587*d[p+1]+.114*d[p+2];y=Math.max(0,Math.min(255,(y-128)*1.55+128));d[p]=d[p+1]=d[p+2]=y;}ctx.putImageData(im,0,0);}
 return canvas;
}
async function ocrCanvas(canvas,label){
 if(!window.Tesseract)throw Error('Không tải được Tesseract.js. Kiểm tra kết nối Internet.');
 status('OCR tăng cường: '+label);
 const result=await Tesseract.recognize(canvas,'vie+eng',{logger:m=>{if(m.status==='recognizing text'&&m.progress)status('OCR '+label+' · '+Math.round(m.progress*100)+'%');}});
 return {text:result.data.text||'',ocrConfidence:Math.round(result.data.confidence||0)};
}
function mergeCandidates(a,b){
 if(!a)return b;if(!b)return a;
 const out={...a};
 // PDF text is the primary evidence. OCR may fill blanks only; never replace a populated
 // field merely because OCR produced a higher completeness score.
 for(const k of ['sellerTax','seller','buyerTax','buyer','formCode','series','number','orderNumber','date','amount','currency','item']){
  if((out[k]===undefined||out[k]===null||String(out[k]).trim()==='')&&b[k])out[k]=b[k];
 }
 out.ocrConfidence=b.ocrConfidence||a.ocrConfidence||0;
 out.sourceMode='PDF text ưu tiên; OCR chỉ bổ sung trường trống';
 out.checks=validateInvoice(out);out.confidence=confidenceScore(out);return out;
}
async function readPdf(file){
 if(!window.pdfjsLib)throw Error('Không tải được PDF.js');
 const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
 let text='';
 for(let p=1;p<=pdf.numPages;p++){
   const page=await pdf.getPage(p),c=await page.getTextContent(),lines=new Map();
   for(const it of c.items){const y=Math.round(it.transform[5]);if(!lines.has(y))lines.set(y,[]);lines.get(y).push(it);}
   for(const [,items] of [...lines.entries()].sort((a,b)=>b[0]-a[0]))text+=items.sort((a,b)=>a.transform[4]-b.transform[4]).map(x=>x.str).join(' ')+'\n';
 }
 let candidate=parseText(text,file.name);candidate.sourceMode='PDF text';
 const mode=$('#engineMode')?.value||'auto';
 if(mode==='text' || (mode==='auto'&&candidate.confidence>=82&&candidate.checks.length<=1))return candidate;
 let ocrText='',ocrScores=[];
 for(let p=1;p<=pdf.numPages;p++){
   const page=await pdf.getPage(p),vp=page.getViewport({scale:2.7}),canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;
   await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;
   const enhanced=makeCanvas(canvas,1,true),result=await ocrCanvas(enhanced,file.name+' · trang '+p+'/'+pdf.numPages);
   ocrText+='\n'+result.text;ocrScores.push(result.ocrConfidence);
 }
 const ocr=parseText(ocrText,file.name);ocr.ocrConfidence=Math.round(ocrScores.reduce((x,y)=>x+y,0)/Math.max(1,ocrScores.length));ocr.sourceMode='OCR enhanced';
 return mergeCandidates(candidate,ocr);
}
async function readImage(file){
 const mode=$('#engineMode')?.value||'auto';
 if(!window.Tesseract)throw Error('Không tải được Tesseract.js. Kiểm tra kết nối Internet.');
 let bitmap;try{bitmap=await createImageBitmap(file);}catch(e){const url=URL.createObjectURL(file);bitmap=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=url;});}
 const scale=Math.max(2,Math.min(3.2,2400/Math.max(bitmap.width,bitmap.height)));
 const raw=makeCanvas(bitmap,scale,false),firstPass=await ocrCanvas(raw,file.name+' · ảnh gốc');
 let candidate=parseText(firstPass.text,file.name);candidate.ocrConfidence=firstPass.ocrConfidence;candidate.sourceMode='OCR ảnh gốc';
 if(mode==='text'||(mode==='auto'&&candidate.confidence>=82&&candidate.checks.length<=1))return candidate;
 const enhanced=makeCanvas(bitmap,scale,true),secondPass=await ocrCanvas(enhanced,file.name+' · tăng tương phản');
 const second=parseText(secondPass.text,file.name);second.ocrConfidence=secondPass.ocrConfidence;second.sourceMode='OCR tăng cường';
 return mergeCandidates(candidate,second);
}
async function readFile(file){
 const ext=file.name.split('.').pop().toLowerCase();
 if(ext==='xml'){const r=parseXml(await file.text(),file.name);r.sourceMode='XML';r.checks=validateInvoice(r);r.confidence=confidenceScore(r);return r;}
 if(ext==='pdf')return readPdf(file);
 if(['jpg','jpeg','png','webp','tif','tiff'].includes(ext))return readImage(file);
 throw Error('Định dạng chưa hỗ trợ: '+ext);
}
function parseXml(xml,file){const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw Error('XML không hợp lệ');const all=[...doc.getElementsByTagName('*')];const local=e=>(e.localName||e.nodeName).toLowerCase();const nodeVal=(parent,names)=>{if(!parent)return '';for(const e of [parent,...parent.getElementsByTagName('*')])if(names.includes(local(e))&&clean(e.textContent))return clean(e.textContent);return '';};const section=names=>all.find(e=>names.includes(local(e)));const sellerSec=section(['nban','seller','thongtinnguoiban']);const buyerSec=section(['nmua','buyer','thongtinnguoimua']);const root=doc.documentElement;const sellerTax=nodeVal(sellerSec,['mst','taxcode'])||nodeVal(root,['mstnb','mstnguoiban']);const buyerTax=nodeVal(buyerSec,['mst','taxcode'])||nodeVal(root,['mstnmua','mstnguoimua']);const data={file,sellerTax,seller:nodeVal(sellerSec,['ten','tennguoiban','sellername']),buyerTax,buyer:nodeVal(buyerSec,['ten','tennguoimua','buyername']),formCode:'',series:nodeVal(root,['khhdon','kyhieu']),number:nodeVal(root,['shdon','sohoadon']),date:dateNorm(nodeVal(root,['nlap','ngaylap','ngayhoadon'])),amount:money(nodeVal(root,['tgtttbso','tongtienthanhtoan','tgtcthue'])),currency:nodeVal(root,['dvtte','loaitien'])||'VND',item:'',account:'',debtAmount:'',paidDate:'',paidAmount:'',raw:root.textContent};data.formCode=data.series?data.series.match(/^\d/)?.[0]||'':'';const fallback=parseText(root.textContent,file);for(const k of ['sellerTax','seller','buyerTax','buyer','series','number','date','amount','item'])if(!data[k])data[k]=fallback[k];return data;}
async function readPdf(file){if(!window.pdfjsLib)throw Error('Không tải được PDF.js');const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;let text='';for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p),c=await page.getTextContent();const lines=new Map();for(const it of c.items){const y=Math.round(it.transform[5]);if(!lines.has(y))lines.set(y,[]);lines.get(y).push(it);}for(const [y,items] of [...lines.entries()].sort((a,b)=>b[0]-a[0]))text+=items.sort((a,b)=>a.transform[4]-b.transform[4]).map(x=>x.str).join(' ')+'\n';}if(text.replace(/\s/g,'').length>60)return text;if(!window.Tesseract)throw Error('PDF scan nhưng thư viện OCR chưa tải.');let out='';for(let p=1;p<=pdf.numPages;p++){status('OCR PDF '+file.name+' · trang '+p+'/'+pdf.numPages);const page=await pdf.getPage(p),vp=page.getViewport({scale:2}),canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));out+='\n'+(await Tesseract.recognize(blob,'vie+eng')).data.text;}return out;}
async function readFile(file){const ext=file.name.split('.').pop().toLowerCase();if(ext==='xml')return parseXml(await file.text(),file.name);let txt;if(ext==='pdf')txt=await readPdf(file);else if(['jpg','jpeg','png','webp','tif','tiff'].includes(ext)){if(!window.Tesseract)throw Error('OCR chưa tải được');txt=(await Tesseract.recognize(file,'vie+eng')).data.text;}else throw Error('Định dạng chưa hỗ trợ: '+ext);return parseText(txt,file.name);}

function classifyInvoice(r){
 const t=String(r.raw||'').toLowerCase();
 if(/meinvoice|misa\.com\.vn|phần mềm misa/.test(t))return 'MISA / MeInvoice';
 if(/einvoice\.fast\.com\.vn|fast software|mã tra cứu hóa đơn/.test(t))return 'FAST eInvoice';
 if(/vnpt|einvoice\.vnpt/.test(t))return 'VNPT Invoice';
 if(/viettel|sinvoice/.test(t))return 'Viettel S-Invoice';
 return 'Mẫu hóa đơn khác';
}
function amountToNumber(v){const n=Number(v);return Number.isFinite(n)?n:null;}
function auditInvoice(r){
 const warnings=[...(r.checks||[])],notes=[];
 const t=String(r.raw||'');
 const total=r.amount?amountToNumber(r.amount):null;
 const before=first(t,[/(?:Cộng tiền hàng|Cộng tiền hàng hóa, dịch vụ|Tổng tiền hàng|Total before VAT)\s*[:：]?\s*([0-9][0-9., ]+)/i]);
 const vat=first(t,[/(?:Tiền thuế GTGT|Thuế GTGT|VAT amount)\s*[:：]?\s*([0-9][0-9., ]+)/i]);
 const base=before?amountToNumber(money(before)):null,tax=vat?amountToNumber(money(vat)):null;
 if(total!==null&&base!==null&&tax!==null&&Math.abs((base+tax)-total)>1)warnings.push('Không khớp: tiền hàng + thuế khác tổng thanh toán');
 if(total!==null&&base!==null&&tax===null&&Math.abs(base-total)>1&&/KCT|KKKNT|không chịu thuế/i.test(t))notes.push('Hóa đơn ghi thuế không chịu thuế/không kê khai; kiểm tra tổng tiền');
 const date=r.date&&r.date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
 if(date){const d=new Date(+date[3],+date[2]-1,+date[1]);if(d.getFullYear()!==+date[3]||d.getMonth()!==+date[2]-1||d.getDate()!==+date[1])warnings.push('Ngày hóa đơn không tồn tại');}
 if(r.sellerTax==='0101243150')warnings.push('MST đơn vị phát hành phần mềm MISA, không phải MST người bán');
 if(r.sellerTax&&r.buyerTax&&r.sellerTax===r.buyerTax)warnings.push('MST người bán và người mua đang trùng nhau');
 if(!r.raw||String(r.raw).replace(/\s/g,'').length<80)warnings.push('Nội dung trích xuất quá ngắn');
 r.templateFamily=classifyInvoice(r);
 r.audit={warnings:[...new Set(warnings)],notes,beforeVat:before?money(before):'',vat:vat?money(vat):'',total:r.amount||''};
 r.checks=r.audit.warnings;
 return r;
}
function detectDuplicates(rows){
 const seen=new Map();
 rows.forEach((r,i)=>{
  if(!r.number||!r.series||!r.sellerTax)return;
  const key=[r.sellerTax,r.series,r.number].join('|');
  if(seen.has(key)){r.checks=[...(r.checks||[]),'Trùng hóa đơn với hồ sơ '+(seen.get(key)+1)];r.duplicateOf=seen.get(key)+1;}
  else seen.set(key,i);
 });
}
function scoreInvoice(r){
 const required=['sellerTax','seller','buyerTax','buyer','series','number','date','amount'];
 const weights={sellerTax:15,seller:10,buyerTax:10,buyer:8,series:12,number:12,date:12,amount:16};
 let score=required.reduce((sum,k)=>sum+(clean(r[k])?weights[k]:0),0);
 if(r.date&&/^\d{2}\/\d{2}\/\d{4}$/.test(r.date))score+=3;
 if(r.sellerTax&&/^(?:\d{10}|\d{12}|\d{10}-\d{3})$/.test(r.sellerTax))score+=3;
 if(r.ocrConfidence!==undefined)score+=Math.round(Math.min(100,r.ocrConfidence)*.07);
 if((r.checks||[]).length)score-=Math.min(25,r.checks.length*5);
 return Math.max(0,Math.min(100,score));
}
function professionalize(r){
 r.checks=validateInvoice(r);
 auditInvoice(r);
 r.confidence=scoreInvoice(r);
 r.sourceMode=r.sourceMode||'PDF text/XML/OCR';
 return r;
}
function review(r){if(r.error)return 'Không nhận dạng';if(r.duplicateOf)return 'Trùng hóa đơn';const missing=['sellerTax','seller','buyerTax','series','number','date','amount'].filter(k=>!clean(r[k]));return missing.length===0&&!(r.checks||[]).length?'Đủ trường hóa đơn':'Cần rà soát';}
function renderBase(){const rows=state.rows,filter=$('#statusFilter').value;$('#fileCount').textContent=rows.length;$('#countTotal').textContent=rows.length;$('#countOk').textContent=rows.filter(r=>review(r)==='Đủ trường hóa đơn').length;$('#countReview').textContent=rows.filter(r=>review(r)==='Cần rà soát').length;$('#countError').textContent=rows.filter(r=>review(r)==='Không nhận dạng').length;const shown=rows.map((r,i)=>({...r,_i:i})).filter(r=>filter==='all'||(filter==='ok'&&review(r)==='Đủ trường hóa đơn')||(filter==='review'&&review(r)==='Cần rà soát')||(filter==='error'&&review(r)==='Không nhận dạng')||(filter==='duplicate'&&review(r)==='Trùng hóa đơn'));$('#resultsBody').innerHTML=shown.length?shown.map(r=>'<tr><td>'+(r._i+1)+'</td><td>'+esc(r.file)+'</td>'+fields.map(k=>'<td><input class="cell" data-i="'+r._i+'" data-k="'+k+'" value="'+esc(r[k]||'')+'" aria-label="'+esc(k)+'"></td>').join('')+'<td><span class="state-pill '+(review(r)==='Đủ trường hóa đơn'?'ok':review(r)==='Không nhận dạng'?'bad':'warn')+'">'+review(r)+' · '+(r.confidence??0)+'%</span><div class="cell-warning">'+esc((r.checks||[]).join(' · '))+'</div></td><td><button class="btn btn-quiet row-delete" data-delete="'+r._i+'">Xóa</button></td></tr>').join(''):'<tr><td colspan="19" class="empty">Không có hồ sơ phù hợp.</td></tr>';$('#resultsBody').querySelectorAll('.cell').forEach(el=>el.addEventListener('change',()=>{state.rows[+el.dataset.i][el.dataset.k]=el.value;render();}));$('#resultsBody').querySelectorAll('[data-delete]').forEach(el=>el.addEventListener('click',()=>{state.rows.splice(+el.dataset.delete,1);render();}));}
function addFiles(files){for(const f of files)if(!state.files.some(x=>x.name===f.name&&x.size===f.size))state.files.push(f);$('#fileCount').textContent=state.files.length;$('#fileList').innerHTML=state.files.map(f=>'<div class="file-item"><span>'+esc(f.name)+'</span><span>'+Math.round(f.size/1024)+' KB</span></div>').join('');}
async function process(){if(!state.files.length){status('Hãy chọn ít nhất một hóa đơn.');return;}$('#processBtn').disabled=true;const fresh=[];let success=0;try{for(let i=0;i<state.files.length;i++){const f=state.files[i];status('Đang xử lý '+f.name+' ('+(i+1)+'/'+state.files.length+')');try{const r=await readFile(f);if(!r.file)r.file=f.name;fresh.push(r);success++;}catch(e){fresh.push({file:f.name,error:e.message});}}if(success){state.rows=fresh.map(r=>r.error?r:professionalize(r));detectDuplicates(state.rows);state.rows.forEach(r=>{if(!r.error){r.checks=[...new Set([...(r.checks||[]),...(r.duplicateOf?['Trùng số hóa đơn trong lô']:[])])];r.confidence=scoreInvoice(r);}});render();status('Đã xử lý '+success+'/'+fresh.length+' tệp. Đã chạy kiểm tra cấu trúc, số tiền và trùng lặp. Vui lòng rà soát cảnh báo.');}else{status('Lô mới không đọc được tệp nào; giữ nguyên lô dữ liệu trước đó.');}}finally{$('#processBtn').disabled=false;}}
function loadTemplate(kind,file){if(!file)return;state.templates[kind]=file;$('#'+kind+'TemplateStatus').textContent='Đã chọn: '+file.name;}
async function exportWorkbookBase(kind){const file=state.templates[kind];if(!file){status('Bạn cần tải lên file Excel mẫu gốc trước khi xuất.');return;}if(!state.rows.length){status('Chưa có dữ liệu hóa đơn.');return;}if(!window.ExcelJS){status('Không tải được ExcelJS.');return;}try{status('Đang nạp và điền biểu mẫu gốc…');const wb=new ExcelJS.Workbook();await wb.xlsx.load(await file.arrayBuffer());const sheetName=kind==='transfer'?'Bảng kê hóa đơn':'Bảng kê hóa đơn GN bù đắp';const ws=wb.getWorksheet(sheetName);if(!ws)throw Error('Không tìm thấy sheet "'+sheetName+'" trong mẫu.');const start=3;const templateRow=ws.getRow(start);for(let r=start;r<=ws.rowCount;r++){const row=ws.getRow(r);for(let c=1;c<=ws.columnCount;c++){if(row.getCell(c).value!==undefined)row.getCell(c).value=null;}}const records=state.rows;records.forEach((x,i)=>{const rn=start+i,row=ws.getRow(rn);if(rn>start){for(let c=1;c<=ws.columnCount;c++){const src=templateRow.getCell(c),dst=row.getCell(c);if(src.style)dst.style=structuredClone(src.style);if(src.numFmt)dst.numFmt=src.numFmt;}}let vals;if(kind==='transfer'){vals=[i+1,x.buyerTax||'',x.buyer||'',x.account||'',x.formCode||'',x.series||'',(x.number||x.orderNumber||''),x.date||'',x.amount?Number(x.amount):null,x.currency||'VND',x.item||'',x.debtAmount?Number(money(x.debtAmount)):null];}else{vals=[i+1,x.sellerTax||'',x.seller||'',x.formCode||'',x.series||'',x.number||'',x.date||'',x.amount?Number(x.amount):null,x.currency||'VND',x.item||'',x.debtAmount?Number(money(x.debtAmount)):null,x.paidDate||'',x.paidAmount?Number(money(x.paidAmount)):null];}vals.forEach((v,j)=>{row.getCell(j+1).value=v;});row.commit();});const out=await wb.xlsx.writeBuffer(),blob=new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=kind==='transfer'?'Bang_ke_hoa_don_chuyen_khoan_VND.xlsx':'Bang_ke_hoa_don_bu_dap_VND.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);status('Đã xuất Excel theo workbook mẫu gốc. Các trường không có dữ liệu vẫn để trống.');}catch(e){console.error(e);status('Không thể xuất: '+e.message);}}

/* Accuracy upgrade v2: source-aware parsing, QR cross-check, strict export gate. */
function xmlField(root, aliases, scope){
 const norm=s=>(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const wanted=aliases.map(norm), base=scope||root;
 const nodes=[base,...base.getElementsByTagName('*')];
 for(const n of nodes){if(wanted.includes(norm(n.localName||n.nodeName))){const v=clean(n.textContent);if(v)return v;}}
 return '';
}
function parseXml(xml,file){
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 if(doc.querySelector('parsererror'))throw Error('XML không hợp lệ hoặc bị lỗi cấu trúc.');
 const root=doc.documentElement,all=[...root.getElementsByTagName('*')];
 const findSection=names=>all.find(n=>names.includes((n.localName||n.nodeName).toLowerCase()));
 const sellerSec=findSection(['nban','seller','thongtinnguoiban','sellerinfo']);
 const buyerSec=findSection(['nmua','buyer','thongtinnguoimua','buyerinfo']);
 const sellerTax=xmlField(root,['mstnb','mstnguoiban','taxcode','taxid'],sellerSec)||xmlField(root,['mstnb','mstnguoiban']);
 const buyerTax=xmlField(root,['mstnmua','mstnguoimua'],buyerSec)||xmlField(root,['mstnmua','mstnguoimua']);
 const fullSeries=xmlField(root,['khhdon','kyhieu','invoiceSeries','series']);
 const formCode=fullSeries&&/^\d[A-Z0-9]{3,17}$/i.test(fullSeries)?fullSeries.slice(0,1):'';
 const series=fullSeries&&formCode?fullSeries.slice(1):fullSeries;
 const number=xmlField(root,['shdon','sohoadon','invoiceNumber','invoiceno']);
 const date=xmlField(root,['nlap','ngaylap','ngayhoadon','invoicedate','issuedate']);
 const total=xmlField(root,['tgtttbso','tgtcthue','tongtienthanhtoan','totalpayment','totalamount','amountdue']);
 const data={file,sellerTax:normalizeTax(sellerTax),seller:xmlField(root,['ten','tennguoiban','sellername','tendv'],sellerSec),buyerTax:normalizeTax(buyerTax),buyer:xmlField(root,['ten','tennguoimua','buyername','tenkh'],buyerSec),formCode,series,number,date:dateNorm(date),amount:money(total),currency:xmlField(root,['dvtte','loaitien','currency'])||'VND',item:xmlField(root,['tenhang','tenhh','tenhanghoa','description','ten']),account:'',debtAmount:'',paidDate:'',paidAmount:'',raw:root.textContent,sourceMode:'XML',evidence:{}};
 data.formCode=data.series?(data.series.match(/^\d/)||[''])[0]:'';
 const fallback=parseText(root.textContent,file);
 for(const k of ['sellerTax','seller','buyerTax','buyer','series','number','date','amount','item'])if(!data[k]&&fallback[k])data[k]=fallback[k];
 data.evidence=buildEvidence(data);
 return data;
}
function qrExtract(text){
 const s=String(text||'');let o={raw:s};
 const pairs=[
  ['sellerTax',/(?:MST|Mã số thuế|tax(?:code|id)?)[=:;\s]+([0-9]{10}(?:-[0-9]{3})?)/i],
  ['number',/(?:SHDon|Số hóa đơn|Invoice(?:No)?)[=:;\s]+([0-9]{3,25})/i],
  ['series',/(?:Ký hiệu|KHHD|Series)[=:;\s]+([0-9A-Z]{4,20})/i],
  ['date',/(?:Ngày lập|NLap|Date)[=:;\s]+(\d{1,2}[/. -]\d{1,2}[/. -]\d{4}|\d{4}-\d{2}-\d{2})/i],
  ['amount',/(?:Tổng tiền thanh toán|Tổng cộng|Amount|Total)[=:;\s]+([0-9][0-9., ]{2,})/i]
 ];
 for(const [k,re] of pairs){const m=s.match(re);if(m)o[k]=k==='date'?dateNorm(m[1]):k==='amount'?money(m[1]):k==='sellerTax'?normalizeTax(m[1]):clean(m[1]);}
 try{const j=JSON.parse(s);const keys={sellerTax:['sellerTax','mst','mstnb','taxCode'],number:['number','shdon','invoiceNumber'],series:['series','khhdon','kyhieu'],date:['date','nlap','invoiceDate'],amount:['amount','tgtttbso','totalAmount']};for(const [k,ks] of Object.entries(keys))if(!o[k])for(const key of ks)if(j[key]){o[k]=k==='date'?dateNorm(j[key]):k==='amount'?money(j[key]):clean(j[key]);break;}}catch(_){}
 return o;
}
function decodeQrCanvas(canvas){
 if(!window.jsQR)return null;
 try{const ctx=canvas.getContext('2d',{willReadFrequently:true}),im=ctx.getImageData(0,0,canvas.width,canvas.height),q=jsQR(im.data,im.width,im.height,{inversionAttempts:'attemptBoth'});return q?.data||null;}catch(_){return null;}
}
function buildEvidence(r){
 const raw=String(r.raw||r.sourceText||''),out={};
 const tests={sellerTax:/Mã\s*số\s*thuế|MST|Tax\s*code/i,seller:/Đơn vị bán hàng|Tên người bán|Seller name/i,buyerTax:/Mã\s*số\s*thuế|MST/i,buyer:/Tên đơn vị|Tên người mua|Buyer/i,series:/Ký hiệu|Series/i,number:/Số hóa đơn|Invoice\s*No/i,date:/Ngày|Date/i,amount:/Tổng.*thanh toán|Total amount/i};
 for(const k of Object.keys(tests)){const v=clean(r[k]);let idx=v?raw.toLowerCase().indexOf(v.toLowerCase()):-1;if(idx<0){const m=tests[k].exec(raw);idx=m?m.index:-1;}out[k]=idx>=0?raw.slice(Math.max(0,idx-70),Math.min(raw.length,idx+180)).replace(/\s+/g,' ').trim():'Không tìm thấy đoạn nguồn rõ ràng';}
 return out;
}
async function scanQrFromPdf(pdf,file){
 if(!window.jsQR)return [];
 const found=[];
 for(let p=1;p<=Math.min(pdf.numPages,3);p++){
  const page=await pdf.getPage(p),vp=page.getViewport({scale:2}),canvas=document.createElement('canvas');
  canvas.width=vp.width;canvas.height=vp.height;
  await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;
  const value=decodeQrCanvas(canvas);if(value)found.push({page:p,text:value,...qrExtract(value)});
 }
 return found;
}
async function readPdf(file){
 if(!window.pdfjsLib)throw Error('Không tải được PDF.js.');
 const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
 let text='';
 for(let p=1;p<=pdf.numPages;p++){
  const page=await pdf.getPage(p),content=await page.getTextContent(),items=content.items.filter(x=>x.str&&x.str.trim());
  const lines=[];
  for(const it of items){const y=Math.round(it.transform[5]/3)*3;let line=lines.find(x=>Math.abs(x.y-y)<=3);if(!line){line={y,items:[]};lines.push(line);}line.items.push(it);}
  for(const line of lines.sort((a,b)=>b.y-a.y))text+=line.items.sort((a,b)=>a.transform[4]-b.transform[4]).map(x=>x.str).join(' ')+'\n';
 }
 let candidate=parseText(text,file.name);candidate.sourceMode=text.replace(/\s/g,'').length>60?'PDF text':'PDF scan';
 const qr=await scanQrFromPdf(pdf,file);
 candidate.qrEvidence=qr;
 if(candidate.sourceMode==='PDF scan'||(candidate.checks||[]).length>1||candidate.confidence<85){
  if(!window.Tesseract)throw Error('PDF scan hoặc dữ liệu thiếu; OCR chưa tải được.');
  let ocrText='',scores=[];
  for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p),vp=page.getViewport({scale:2.8}),canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;const result=await ocrCanvas(makeCanvas(canvas,1,true),file.name+' · trang '+p+'/'+pdf.numPages);ocrText+='\n'+result.text;scores.push(result.ocrConfidence);}
  const ocr=parseText(ocrText,file.name);ocr.ocrConfidence=Math.round(scores.reduce((a,b)=>a+b,0)/Math.max(1,scores.length));ocr.sourceMode='OCR tăng cường';
  candidate=mergeCandidates(candidate,ocr);candidate.qrEvidence=qr;
 }
 return reconcileQr(candidate);
}
async function readImage(file){
 if(!window.Tesseract)throw Error('Không tải được Tesseract.js.');
 const bitmap=await createImageBitmap(file),scale=Math.max(2,Math.min(3.2,2600/Math.max(bitmap.width,bitmap.height)));
 const original=makeCanvas(bitmap,scale,false),enhanced=makeCanvas(bitmap,scale,true);
 const qr=decodeQrCanvas(original)||decodeQrCanvas(enhanced);
 const p1=await ocrCanvas(original,file.name+' · ảnh gốc'),a=parseText(p1.text,file.name);a.ocrConfidence=p1.ocrConfidence;a.sourceMode='OCR ảnh gốc';
 const p2=await ocrCanvas(enhanced,file.name+' · tăng tương phản'),b=parseText(p2.text,file.name);b.ocrConfidence=p2.ocrConfidence;b.sourceMode='OCR tăng cường';
 const r=mergeCandidates(a,b);r.qrEvidence=qr?[{page:1,text:qr,...qrExtract(qr)}]:[];
 return reconcileQr(r);
}
function reconcileQr(r){
 const entries=r.qrEvidence||[],q=entries.map(x=>x.text?x:qrExtract(x)).find(x=>x&&Object.keys(x).some(k=>['sellerTax','number','series','date','amount'].includes(k)));
 r.qrConflicts=[];
 if(q){for(const k of ['sellerTax','number','series','date','amount'])if(q[k]){if(r[k]&&String(r[k])!==String(q[k]))r.qrConflicts.push('QR khác '+k+': PDF/XML='+r[k]+'; QR='+q[k]);else if(!r[k])r[k]=q[k];}}
 if(r.qrConflicts.length)r.checks=[...(r.checks||[]),...r.qrConflicts];
 r.evidence=buildEvidence(r);return r;
}
async function readFile(file){
 const ext=file.name.split('.').pop().toLowerCase();
 if(ext==='xml')return parseXml(await file.text(),file.name);
 if(ext==='pdf')return readPdf(file);
 if(['jpg','jpeg','png','webp','tif','tiff'].includes(ext))return readImage(file);
 throw Error('Định dạng chưa hỗ trợ: '+ext);
}
function scoreInvoice(r){
 const keys=['sellerTax','seller','buyerTax','buyer','series','number','date','amount'];
 const weights={sellerTax:15,seller:10,buyerTax:8,buyer:7,series:12,number:12,date:12,amount:16};
 let score=keys.reduce((n,k)=>n+(clean(r[k])?weights[k]:0),0);
 if(r.sourceMode==='XML')score+=10;
 else if(r.sourceMode==='PDF text')score+=7;
 else if(r.sourceMode==='OCR tăng cường'||r.sourceMode==='OCR ảnh gốc')score+=Math.round((r.ocrConfidence||0)*.04);
 if(r.date){const m=r.date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(m){const d=new Date(+m[3],+m[2]-1,+m[1]);if(d.getDate()!==+m[1]||d.getMonth()!==+m[2]-1||d.getFullYear()!==+m[3])score-=15;}}
 if(r.sellerTax&&!/^(\d{10}|\d{12}|\d{10}-\d{3})$/.test(r.sellerTax))score-=15;
 score-=Math.min(35,(r.checks||[]).length*7);
 score-=Math.min(25,(r.qrConflicts||[]).length*12);
 return Math.max(0,Math.min(100,score));
}
function render(){
 renderBase();
 document.querySelectorAll('#resultsBody tr').forEach((tr)=>{
  const idx=tr.querySelector('.cell')?.dataset.i;if(idx===undefined)return;
  const r=state.rows[Number(idx)];if(!r)return;
  const fileCell=tr.children[1];if(fileCell&&!fileCell.querySelector('.source-details')){
   const details=document.createElement('details');details.className='source-details';
   const summary=document.createElement('summary');summary.textContent=(r.sourceMode||'Nguồn chưa rõ')+' · '+(r.templateFamily||classifyInvoice(r));
   const body=document.createElement('div');body.className='source-evidence';
   body.innerHTML='<b>Bằng chứng nhận dạng</b><p>QR: '+(r.qrEvidence?.length?'Đã phát hiện '+r.qrEvidence.length+' mã':'Không phát hiện / thư viện chưa sẵn sàng')+'</p><p>'+esc((r.qrConflicts||[]).join(' | '))+'</p><pre>'+esc((r.raw||r.sourceText||'').slice(0,1800))+'</pre>';
   details.append(summary,body);fileCell.append(details);
  }
 });
}
async function exportWorkbook(kind){
 // Flexible export is the default and only mode: missing invoice fields remain blank.
 return exportWorkbookBase(kind);
}

const mergeFiles=[];
function renderMergeFiles(){
 const box=$('#mergeFileList');if(!box)return;
 box.innerHTML=mergeFiles.map((f,i)=>'<div class="merge-file"><span class="merge-index">'+(i+1)+'.</span><span class="merge-name">'+esc(f.name)+' <small>('+Math.max(1,Math.round(f.size/1024))+' KB)</small></span><span class="merge-actions"><button type="button" class="btn btn-quiet merge-move" data-up="'+i+'" '+(i===0?'disabled':'')+'>↑</button><button type="button" class="btn btn-quiet merge-move" data-down="'+i+'" '+(i===mergeFiles.length-1?'disabled':'')+'>↓</button><button type="button" class="btn btn-quiet merge-remove" data-remove="'+i+'">Xóa</button></span></div>').join('');
 $('#mergeCount').textContent=mergeFiles.length+'/10 tệp';
 $('#mergePdfBtn').disabled=mergeFiles.length===0;
 box.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{mergeFiles.splice(+b.dataset.remove,1);renderMergeFiles();}));
 box.querySelectorAll('[data-up]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.up;if(i>0){[mergeFiles[i-1],mergeFiles[i]]=[mergeFiles[i],mergeFiles[i-1]];renderMergeFiles();}}));
 box.querySelectorAll('[data-down]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.down;if(i<mergeFiles.length-1){[mergeFiles[i+1],mergeFiles[i]]=[mergeFiles[i],mergeFiles[i+1]];renderMergeFiles();}}));
}
function addMergeFiles(incoming){
 const accepted=incoming.filter(f=>/\.pdf$|\.(?:jpe?g|png|webp)$/i.test(f.name));
 for(const f of accepted){if(mergeFiles.length>=10)break;if(!mergeFiles.some(x=>x.name===f.name&&x.size===f.size))mergeFiles.push(f);}
 renderMergeFiles();
 const rejected=incoming.length-accepted.length;
 if(rejected)status('Một số tệp không đúng định dạng. Chỉ nhận PDF, JPG, PNG, WEBP.');
 else if(incoming.length+mergeFiles.length>10)status('Giới hạn tối đa là 10 tệp.');
}
async function imageToPdfPage(pdfDoc,file){
 const bitmap=await createImageBitmap(file);
 const scale=Math.min(2,3000/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
 canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
 const png=await pdfDoc.embedPng(await canvas.toDataURL('image/png'));
 const page=pdfDoc.addPage([png.width,png.height]);page.drawImage(png,{x:0,y:0,width:png.width,height:png.height});
}
async function mergeToPdf(){
 if(!mergeFiles.length)return;
 if(!window.PDFLib?.PDFDocument){status('Không tải được thư viện gộp PDF. Hãy tải lại trang khi có Internet.');return;}
 $('#mergePdfBtn').disabled=true;
 try{
  const out=await PDFLib.PDFDocument.create();let pageCount=0;
  for(let i=0;i<mergeFiles.length;i++){
   const f=mergeFiles[i];status('Đang gộp '+f.name+' ('+(i+1)+'/'+mergeFiles.length+')');
   if(/\.pdf$/i.test(f.name)){
    const src=await PDFLib.PDFDocument.load(await f.arrayBuffer(),{ignoreEncryption:false});
    const copied=await out.copyPages(src,src.getPageIndices());copied.forEach(p=>out.addPage(p));pageCount+=copied.length;
   }else{await imageToPdfPage(out,f);pageCount++;}
  }
  if(!pageCount)throw Error('Không tìm thấy trang hợp lệ để gộp.');
  const bytes=await out.save(),blob=new Blob([bytes],{type:'application/pdf'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='Gop_hoa_don_'+new Date().toISOString().slice(0,10)+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
  status('Đã gộp '+mergeFiles.length+' tệp thành PDF gồm '+pageCount+' trang.');
 }catch(e){console.error(e);status('Không thể gộp PDF: '+(e.message||e));}
 finally{$('#mergePdfBtn').disabled=mergeFiles.length===0;}
}
$('#mergeFilesInput').addEventListener('change',e=>{addMergeFiles([...e.target.files]);e.target.value='';});
$('#mergePdfBtn').addEventListener('click',mergeToPdf);


$('#fileInput').addEventListener('change',e=>addFiles([...e.target.files]));$('#processBtn').addEventListener('click',process);$('#clearBtn').addEventListener('click',()=>{if(confirm('Xóa toàn bộ hồ sơ của lô hiện tại?')){state.files=[];state.rows=[];$('#fileInput').value='';$('#fileList').innerHTML='';render();status('Đã xóa lô hiện tại.');}});$('#statusFilter').addEventListener('change',render);$('#deleteErrors').addEventListener('click',()=>{if(confirm('Xóa tất cả hồ sơ không nhận dạng?')){state.rows=state.rows.filter(r=>review(r)!=='Không nhận dạng');render();}});$('#transferTemplate').addEventListener('change',e=>loadTemplate('transfer',e.target.files[0]));$('#offsetTemplate').addEventListener('change',e=>loadTemplate('offset',e.target.files[0]));$('#exportTransfer').addEventListener('click',()=>exportWorkbook('transfer'));$('#exportOffset').addEventListener('click',()=>exportWorkbook('offset'));const dz=$('#dropzone');['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('dragging');}));['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('dragging');}));dz.addEventListener('drop',e=>addFiles([...e.dataTransfer.files]));render();
})();