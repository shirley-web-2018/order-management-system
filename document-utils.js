(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.OrderDocumentUtils=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const MAX_FILE_SIZE=10*1024*1024;
  const ALLOWED_EXTENSIONS=new Set(['pdf','png','jpg','jpeg','webp','doc','docx','xls','xlsx']);
  function extension(name=''){const part=String(name).trim().toLowerCase().split('.');return part.length>1?part.pop():''}
  function safeFileName(name='file'){const cleaned=String(name).normalize('NFKC').replace(/[\\/:*?"<>|#%{}\[\]]/g,'_').replace(/\s+/g,'_').slice(-100);return cleaned||'file'}
  function formatSize(size=0){const value=Number(size)||0;if(value<1024)return `${value} B`;if(value<1024*1024)return `${(value/1024).toFixed(1)} KB`;return `${(value/1024/1024).toFixed(1)} MB`}
  function validateFiles(files){const valid=[],errors=[];Array.from(files||[]).forEach(file=>{if(!ALLOWED_EXTENSIONS.has(extension(file.name)))errors.push(`${file.name}：不支持此文件格式`);else if(Number(file.size)>MAX_FILE_SIZE)errors.push(`${file.name}：超过 10 MB`);else valid.push(file)});return{valid,errors}}
  function normalizeDocuments(order){const source=order?.documents||{};const normalize=list=>Array.isArray(list)?list.filter(item=>item&&item.path&&item.name).map(item=>({name:String(item.name),path:String(item.path),size:Number(item.size)||0,type:String(item.type||''),uploadedAt:String(item.uploadedAt||'')})):[];return{contract:normalize(source.contract),invoice:normalize(source.invoice)}}
  function buildPath(userId,orderId,kind,file,index=0,now=Date.now()){const random=typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`${now}-${index}`;return `${userId}/${orderId}/${kind}/${now}-${random}-${safeFileName(file.name)}`}
  return{MAX_FILE_SIZE,validateFiles,normalizeDocuments,buildPath,formatSize,safeFileName};
});
