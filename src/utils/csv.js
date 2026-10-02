export function parseCsv(text) {
 const rows=[];let row=[],cell='',quoted=false;const source=text.replace(/^\uFEFF/,'');const firstLine=source.split(/\r?\n/)[0];const separator=firstLine.includes(';')?';':','
 for(let i=0;i<source.length;i++){const c=source[i];if(c==='"'){if(quoted && source[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(c===separator && !quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r') && !quoted){if(c==='\r' && source[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell=''}else cell+=c}
 if(quoted)throw new Error('CSV contém aspas sem fechamento.');row.push(cell);if(row.some(v=>v.trim()))rows.push(row)
 const headers=rows.shift()?.map(v=>v.trim()) || [];if(!headers.includes('id'))throw new Error('O CSV precisa da coluna id.');if(rows.length>200)throw new Error('Importe até 200 linhas por vez.');const result=rows.map(cells=>Object.fromEntries(headers.map((h,i)=>[h,cells[i]?.trim() || ''])));if(result.some(r=>!r.id))throw new Error('Todas as linhas precisam de ID.');return result
}
