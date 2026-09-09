(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.OrderImportUtils=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const aliases={
    id:['订单编号','订单号','id'],customer:['客户名称','客户','公司名称'],contact:['联系人','联系方式'],requirement:['客户需求','需求','产品','产品需求'],amount:['订单金额','金额'],paid:['已收金额','已付款金额','收款金额'],owner:['负责人','跟进人'],dueDate:['预计交付','预计交付日期','交付日期'],status:['总体状态','订单状态','状态'],contract:['合同','合同状态'],invoice:['发票','发票状态'],shipping:['发货','发货状态'],payment:['回款','回款状态','付款状态'],logistics:['物流信息','快递信息','物流'],carrier:['快递公司','物流公司'],tracking:['快递单号','物流单号'],feedback:['客户反馈','反馈'],notes:['备注','内部备注'],priority:['优先级']
  };
  const optionAliases={
    status:{'合同待客户盖章':'合同处理中'},
    contract:{'已完成':'已签订','合同已完成':'已签订','已经签订':'已签订','在做合同中':'起草中','合同待客户盖章':'待盖章'},
    invoice:{'已经开票':'已开票','发票已开':'已开票'},
    shipping:{'已经发货':'已发货'},
    payment:{'已经付款':'已付清','已付款':'已付清','付款完成':'已付清'}
  };
  const cleanKey=value=>String(value??'').replace(/^\uFEFF/,'').replace(/[\s_\-]/g,'').toLowerCase();
  const cleanText=value=>String(value??'').trim();
  const normalizeRecord=row=>Object.fromEntries(Object.entries(row||{}).map(([key,value])=>[cleanKey(key),value]));
  const pick=(record,names)=>{for(const name of names){const key=cleanKey(name);if(Object.prototype.hasOwnProperty.call(record,key))return record[key]}return ''};
  const asNumber=value=>{const normalized=cleanText(value).replace(/[¥￥,，\s]/g,'');const number=Number(normalized);return Number.isFinite(number)?number:0};
  function asDate(value){
    if(value instanceof Date&&!Number.isNaN(value.valueOf()))return value.toISOString().slice(0,10);
    if(typeof value==='number'&&Number.isFinite(value)){const date=new Date(Date.UTC(1899,11,30)+Math.round(value)*86400000);return date.toISOString().slice(0,10)}
    const text=cleanText(value);if(!text)return '';
    const match=text.replace(/[年月]/g,'-').replace(/日/g,'').match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
    if(!match)return '';
    return `${match[1]}-${String(match[2]).padStart(2,'0')}-${String(match[3]).padStart(2,'0')}`;
  }
  function parseLogistics(value,carrierValue='',trackingValue=''){
    const items=[];const text=cleanText(value);
    if(text)text.split(/[；;\n]+/).map(x=>x.trim()).filter(Boolean).forEach(part=>{const index=part.search(/[:：]/);if(index>=0)items.push({carrier:part.slice(0,index).trim(),tracking:part.slice(index+1).trim()});else items.push({carrier:'',tracking:part})});
    const carrier=cleanText(carrierValue),tracking=cleanText(trackingValue);if((carrier||tracking)&&!items.some(x=>x.carrier===carrier&&x.tracking===tracking))items.push({carrier,tracking});
    return items.filter(x=>x.carrier||x.tracking);
  }
  const normalizeOption=(type,value)=>optionAliases[type]?.[cleanText(value)]||cleanText(value);
  function inferStatus(raw,order){
    const status=normalizeOption('status',raw);
    if(status==='合同已完成'){
      if(order.payment==='已付清'&&['已发货','已签收','无需发货'].includes(order.shipping))return '已完成';
      if(order.shipping==='已发货'||order.shipping==='已签收')return '已发货';
      if(order.invoice==='已开票'||order.invoice==='已寄出')return '待发货';
      return '合同处理中';
    }
    return status||'需求确认中';
  }
  function mapRow(row,rowNumber=0){
    const record=normalizeRecord(row);
    const logistics=parseLogistics(pick(record,aliases.logistics),pick(record,aliases.carrier),pick(record,aliases.tracking));
    const order={
      id:cleanText(pick(record,aliases.id)),customer:cleanText(pick(record,aliases.customer)),contact:cleanText(pick(record,aliases.contact)),requirement:cleanText(pick(record,aliases.requirement)),amount:asNumber(pick(record,aliases.amount)),paid:asNumber(pick(record,aliases.paid)),owner:cleanText(pick(record,aliases.owner))||'管理员',dueDate:asDate(pick(record,aliases.dueDate)),priority:cleanText(pick(record,aliases.priority))||'普通',contract:normalizeOption('contract',pick(record,aliases.contract))||'未准备',invoice:normalizeOption('invoice',pick(record,aliases.invoice))||'未申请',shipping:normalizeOption('shipping',pick(record,aliases.shipping))||'未备货',payment:normalizeOption('payment',pick(record,aliases.payment))||'未付款',logistics,carrier:logistics[0]?.carrier||'',tracking:logistics[0]?.tracking||'',feedback:cleanText(pick(record,aliases.feedback)),notes:cleanText(pick(record,aliases.notes))
    };
    order.status=inferStatus(pick(record,aliases.status),order);
    const missing=[];if(!order.customer)missing.push('客户名称');if(!order.requirement)missing.push('客户需求');
    return {rowNumber,order,valid:missing.length===0,error:missing.length?`缺少${missing.join('和')}`:''};
  }
  function fingerprint(order){
    const logistics=(order.logistics||[]).map(x=>`${cleanText(x.carrier).toLowerCase()}::${cleanText(x.tracking).toLowerCase()}`).sort();
    return JSON.stringify([cleanText(order.customer).toLowerCase(),cleanText(order.contact).toLowerCase(),cleanText(order.requirement).toLowerCase(),Number(order.amount||0),Number(order.paid||0),cleanText(order.owner).toLowerCase(),cleanText(order.dueDate),cleanText(order.priority),cleanText(order.status),cleanText(order.contract),cleanText(order.invoice),cleanText(order.shipping),cleanText(order.payment),logistics,cleanText(order.feedback).toLowerCase(),cleanText(order.notes).toLowerCase()]);
  }
  function analyze(rows,existing=[]){
    const existingFingerprints=new Set(existing.map(fingerprint));const seen=new Set();const existingById=new Map(existing.map(order=>[order.id,order]));const valid=[];const invalid=[];
    rows.forEach((row,index)=>{const mapped=mapRow(row,index+2);if(!mapped.valid){invalid.push(mapped);return}const key=fingerprint(mapped.order);mapped.duplicate=existingFingerprints.has(key)||seen.has(key);mapped.update=Boolean(mapped.order.id&&existingById.has(mapped.order.id)&&!mapped.duplicate);mapped.isNew=!mapped.update&&!mapped.duplicate;seen.add(key);valid.push(mapped)});
    return {total:rows.length,valid,invalid,duplicates:valid.filter(x=>x.duplicate),updates:valid.filter(x=>x.update),newItems:valid.filter(x=>x.isNew)};
  }
  function makeUniqueId(used,now,index){
    const date=new Date(now).toISOString().slice(0,10).replaceAll('-','');let suffix=String((now+index)%1000000).padStart(6,'0');let id=`OD${date}${suffix}`;while(used.has(id)){suffix=String((Number(suffix)+1)%1000000).padStart(6,'0');id=`OD${date}${suffix}`}used.add(id);return id;
  }
  function prepare(analysis,existing=[],includeDuplicates=false,now=Date.now()){
    const used=new Set(existing.map(order=>order.id));const output=[];
    analysis.valid.forEach((item,index)=>{if(item.duplicate&&!includeDuplicates)return;const order={...item.order,logistics:(item.order.logistics||[]).map(x=>({...x}))};let id=order.id;if(!id||(item.duplicate&&used.has(id))||(output.some(x=>x.id===id)&&!item.update))id=makeUniqueId(used,now,index);else used.add(id);order.id=id;order.updated=now+index;output.push(order)});
    return output;
  }
  return {mapRow,fingerprint,analyze,prepare,parseLogistics,asDate};
});
