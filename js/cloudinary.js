// ══════════════════════════════════════════════
// CLOUDINARY — загрузка медиа
// ══════════════════════════════════════════════
const CL_CLOUD  = 'dqywtjzuz';
const CL_PRESET = 'biomediki_upload';
const CL_URL    = `https://api.cloudinary.com/v1_1/${CL_CLOUD}/upload`;

// ── CORE UPLOAD ──
// Принимает File объект, возвращает { url, type: 'image'|'video' }
async function clUpload(file, onProgress){
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CL_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', CL_URL);
    if(onProgress){
      xhr.upload.onprogress = e => {
        if(e.lengthComputable) onProgress(Math.round(e.loaded/e.total*100));
      };
    }
    xhr.onload = () => {
      try{
        const res = JSON.parse(xhr.responseText);
        if(res.secure_url){
          resolve({ url: res.secure_url, type: res.resource_type, originalFilename: res.original_filename, format: res.format, bytes: res.bytes });
        } else {
          reject(new Error(res.error?.message || 'upload failed'));
        }
      }catch(e){ reject(e); }
    };
    xhr.onerror = () => reject(new Error('network error'));
    xhr.send(fd);
  });
}

// ── UPLOAD BUTTON HELPER ──
// Создаёт скрытый input[type=file], открывает picker, загружает
// options: { accept, onStart, onProgress, onDone, onError }
function clPickAndUpload(options={}){
  const accept = options.accept || 'image/*,video/*';
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = accept;
  inp.style.display = 'none';
  document.body.appendChild(inp);

  inp.onchange = async () => {
    const file = inp.files[0];
    document.body.removeChild(inp);
    if(!file) return;

    // size check: 100MB max
    if(file.size > 100*1024*1024){
      toast('файл слишком большой (макс 100 МБ)');
      return;
    }

    if(options.onStart) options.onStart(file);

    try{
      const result = await clUpload(file, options.onProgress);
      if(options.onDone) options.onDone(result, file);
    }catch(e){
      console.error('Cloudinary upload error:', e);
      toast('ошибка загрузки: ' + e.message);
      if(options.onError) options.onError(e);
    }
  };

  inp.click();
}

// ── PREVIEW HELPER ──
// Показывает превью файла до/во время загрузки
function clPreview(file, imgEl){
  if(!imgEl) return;
  if(file.type.startsWith('image/')){
    const reader = new FileReader();
    reader.onload = e => { imgEl.src = e.target.result; imgEl.style.display = 'block'; };
    reader.readAsDataURL(file);
  } else if(file.type.startsWith('video/')){
    imgEl.src = ''; imgEl.style.display = 'none';
  }
}
