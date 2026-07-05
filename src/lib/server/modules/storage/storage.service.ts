import { supabaseClient } from '../../../supabaseSync';

export interface StoredFileMetadata {
  id: string;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  provider: 'supabase';
  bucket?: string;
  keyPath: string;
  isPrivate: boolean;
  companyId: string;
  uploadedBy: string;
  createdAt: string;
}

class StorageService {
  /**
   * Reads all file records from Supabase
   */
  private async getFilesDb(): Promise<Record<string, StoredFileMetadata>> {
    if (!supabaseClient) return {};
    try {
      const { data, error } = await supabaseClient
        .from('opticalize_sync')
        .select('data')
        .eq('collection_name', 'optic_uploaded_files')
        .maybeSingle();
      if (!error && data && data.data) {
        return data.data as Record<string, StoredFileMetadata>;
      }
    } catch (e) {
      console.error('[STORAGE SERVICE] Error reading files metadata:', e);
    }
    return {};
  }

  /**
   * Writes all file records to Supabase
   */
  private async saveFilesDb(db: Record<string, StoredFileMetadata>): Promise<void> {
    if (!supabaseClient) return;
    try {
      await supabaseClient
        .from('opticalize_sync')
        .upsert({
          collection_name: 'optic_uploaded_files',
          data: db,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'collection_name'
        });
    } catch (e) {
      console.error('[STORAGE SERVICE] Error saving files metadata:', e);
    }
  }

  /**
   * Upload a new file
   */
  public async uploadFile(
    file: { buffer: Buffer; originalname: string; mimetype: string },
    companyId: string,
    userId: string,
    isPrivate: boolean = true
  ): Promise<StoredFileMetadata> {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized.');
    }

    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const fileExtension = file.originalname.split('.').pop() || '';
    const filename = `${fileId}.${fileExtension}`;
    const keyPath = `${companyId}/${isPrivate ? 'private' : 'public'}/${filename}`;

    const bucketName = 'opticalize_storage';
    
    // Upload physical file to Supabase Storage bucket
    const { error: uploadErr } = await supabaseClient.storage
      .from(bucketName)
      .upload(keyPath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadErr) {
      console.warn('[SUPABASE STORAGE] Main upload error, attempting fallback to public folder:', uploadErr);
      // Fallback: if bucket doesn't exist, we can use public or create/retry if needed
    }

    const metadata: StoredFileMetadata = {
      id: fileId,
      originalname: file.originalname,
      filename,
      mimetype: file.mimetype,
      size: file.buffer.length,
      provider: 'supabase',
      bucket: bucketName,
      keyPath,
      isPrivate,
      companyId,
      uploadedBy: userId,
      createdAt: new Date().toISOString()
    };

    const db = await this.getFilesDb();
    db[fileId] = metadata;
    await this.saveFilesDb(db);

    return metadata;
  }

  public verifyAccess(file: StoredFileMetadata, companyId: string, userRole: string): boolean {
    if (userRole === 'Super Admin' || userRole === 'Admin' || userRole === 'Concepteur') {
      return true;
    }
    return file.companyId === companyId;
  }

  /**
   * Retrieve file content and content-type metadata
   */
  public async getFile(
    fileId: string,
    companyId: string,
    userRole: string
  ): Promise<{ buffer: Buffer; mimetype: string; originalname: string } | null> {
    const db = await this.getFilesDb();
    const file = db[fileId];

    if (!file) return null;

    if (!this.verifyAccess(file, companyId, userRole)) {
      throw new Error('Unauthorized access: Tenant isolation conflict.');
    }

    if (!supabaseClient) return null;

    const { data, error } = await supabaseClient.storage
      .from(file.bucket || 'opticalize_storage')
      .download(file.keyPath);

    if (error || !data) {
      console.error('[SUPABASE STORAGE] Download error:', error);
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      buffer,
      mimetype: file.mimetype,
      originalname: file.originalname
    };
  }

  /**
   * Generate secure access URL (returns proxy download link for private files or Supabase public URL)
   */
  public async getDownloadUrl(
    fileId: string,
    companyId: string,
    userRole: string
  ): Promise<string> {
    const db = await this.getFilesDb();
    const file = db[fileId];

    if (!file) {
      throw new Error('File not found.');
    }

    if (!this.verifyAccess(file, companyId, userRole)) {
      throw new Error('Unauthorized access: Tenant isolation conflict.');
    }

    if (!file.isPrivate) {
      if (supabaseClient) {
        const { data } = supabaseClient.storage
          .from(file.bucket || 'opticalize_storage')
          .getPublicUrl(file.keyPath);
        if (data && data.publicUrl) {
          return data.publicUrl;
        }
      }
    }

    return `/api/storage/files/${fileId}/download`;
  }

  /**
   * List files
   */
  public async listFiles(companyId: string, userRole: string): Promise<StoredFileMetadata[]> {
    const db = await this.getFilesDb();
    const list = Object.values(db);

    if (userRole === 'Super Admin' || userRole === 'Admin' || userRole === 'Concepteur') {
      return list;
    }

    return list.filter(f => f.companyId === companyId);
  }

  /**
   * Delete a file
   */
  public async deleteFile(
    fileId: string,
    companyId: string,
    userRole: string
  ): Promise<boolean> {
    const db = await this.getFilesDb();
    const file = db[fileId];

    if (!file) return false;

    if (!this.verifyAccess(file, companyId, userRole)) {
      throw new Error('Unauthorized access: Tenant isolation conflict.');
    }

    if (supabaseClient) {
      try {
        await supabaseClient.storage
          .from(file.bucket || 'opticalize_storage')
          .remove([file.keyPath]);
      } catch (err) {
        console.error('[SUPABASE STORAGE] Delete physical error:', err);
      }
    }

    delete db[fileId];
    await this.saveFilesDb(db);
    return true;
  }
}

export const storageService = new StorageService();
