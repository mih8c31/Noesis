const Upload = {
  async handleFile(file, libraryId) {
    const validation = Utils.validatePdfFile(file);
    if (!validation.valid) {
      Utils.showToast(validation.error, 'error');
      return null;
    }

    const user = supabase.user;
    if (!user) {
      Utils.showToast('Nao autenticado', 'error');
      return null;
    }

    // 1. Create document record
    const docData = {
      user_id: user.id,
      title: Utils.getDocumentTitle(file.name),
      file_name: file.name,
      file_size: file.size,
      file_path: '',
      storage_bucket: 'documents',
      status: 'uploading',
      page_count: null,
    };

    const { data: doc, error: createErr } = await supabase.from('documents').insert(docData);
    if (createErr) {
      Utils.showToast(`Erro ao criar documento: ${createErr}`, 'error');
      return null;
    }

    const document = Array.isArray(doc) ? doc[0] : doc;

    // 2. Upload to storage
    const userId = user.id;
    const docId = document.id;
    const sanitized = Utils.sanitizeFileName(file.name);
    const filePath = `${userId}/${docId}/${sanitized}`;

    const { error: uploadErr } = await supabase.storageUpload('documents', filePath, file);
    if (uploadErr) {
      await supabase.from('documents').eq('id', docId).update({ status: 'error' });
      Utils.showToast(`Erro ao enviar: ${uploadErr}`, 'error');
      return null;
    }

    // 3. Update document with file path and status
    const { error: updateErr } = await supabase.from('documents')
      .eq('id', docId)
      .update({ file_path: filePath, status: 'ready' });

    if (updateErr) {
      Utils.showToast(`Erro ao finalizar: ${updateErr}`, 'error');
      return null;
    }

    return { ...document, file_path: filePath, status: 'ready' };
  },
};
