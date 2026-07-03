import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { readStorage, writeStorage } from '../../core/database';

export interface StoredFileMetadata {
  id: string;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  provider: 'local' | 's3' | 'minio' | 'r2';
  bucket?: string;
  keyPath: string;
  isPrivate: boolean;
  companyId: string;
  uploadedBy: string;
  createdAt: string;
}

class StorageService {
  private provider: 'local' | 's3' | 'minio' | 'r2';
  private localDir: string;
  private s3Client: S3Client | null = null;
  private bucketName: string = '';

  constructor() {
    // Read from env with secure fallback defaults
    const envProvider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
    if (['local', 's3', 'minio', 'r2'].includes(envProvider)) {
      this.provider = envProvider as any;
    } else {
      this.provider = 'local';
    }

    this.localDir = path.resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR || './uploads');

    if (this.provider === 'local') {
      if (!fs.existsSync(this.localDir)) {
        fs.mkdirSync(this.localDir, { recursive: true });
      }
    } else {
      // Configure S3/MinIO/Cloudflare R2 client
      const endpoint = process.env.STORAGE_S3_ENDPOINT; // e.g. for MinIO/R2
      const region = process.env.STORAGE_S3_REGION || 'us-east-1';
      const accessKeyId = process.env.STORAGE_S3_ACCESS_KEY_ID;
      const secretAccessKey = process.env.STORAGE_S3_SECRET_ACCESS_KEY;
      this.bucketName = process.env.STORAGE_S3_BUCKET || 'opticalize-bucket';

      if (accessKeyId && secretAccessKey) {
        this.s3Client = new S3Client({
          endpoint: endpoint || undefined,
          region,
          credentials: {
            accessKeyId,
            secretAccessKey
          },
          forcePathStyle: process.env.STORAGE_S3_FORCE_PATH_STYLE === 'true' || this.provider === 'minio'
        });
        console.log(`[STORAGE SERVICE] Initialized cloud client for provider: ${this.provider.toUpperCase()} on bucket: ${this.bucketName}`);
      } else {
        console.warn(`[STORAGE SERVICE] Cloud storage provider '${this.provider}' requested but missing ACCESS_KEY_ID or SECRET_ACCESS_KEY. Falling back to local storage.`);
        this.provider = 'local';
        if (!fs.existsSync(this.localDir)) {
          fs.mkdirSync(this.localDir, { recursive: true });
        }
      }
    }
  }

  /**
   * Reads all file records from database storage
   */
  private getFilesDb(): Record<string, StoredFileMetadata> {
    return readStorage<Record<string, StoredFileMetadata>>('uploaded_files', {});
  }

  /**
   * Writes all file records to database storage
   */
  private saveFilesDb(db: Record<string, StoredFileMetadata>): void {
    writeStorage('uploaded_files', db);
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
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const fileExtension = path.extname(file.originalname);
    const filename = `${fileId}${fileExtension}`;
    const keyPath = `${companyId}/${isPrivate ? 'private' : 'public'}/${filename}`;

    if (this.provider === 'local') {
      const destinationPath = path.join(this.localDir, filename);
      await fs.promises.writeFile(destinationPath, file.buffer);
    } else if (this.s3Client) {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: keyPath,
        Body: file.buffer,
        ContentType: file.mimetype
      });
      await this.s3Client.send(command);
    } else {
      throw new Error('S3 Client was not initialized properly.');
    }

    const metadata: StoredFileMetadata = {
      id: fileId,
      originalname: file.originalname,
      filename,
      mimetype: file.mimetype,
      size: file.buffer.length,
      provider: this.provider,
      bucket: this.provider !== 'local' ? this.bucketName : undefined,
      keyPath: this.provider === 'local' ? filename : keyPath,
      isPrivate,
      companyId,
      uploadedBy: userId,
      createdAt: new Date().toISOString()
    };

    const db = this.getFilesDb();
    db[fileId] = metadata;
    this.saveFilesDb(db);

    return metadata;
  }

  /**
   * Check access permissions for a file (Tenant isolation & Public/Private rules)
   */
  public verifyAccess(file: StoredFileMetadata, companyId: string, userRole: string): boolean {
    // Super admins always bypass restrictions
    if (userRole === 'Super Admin' || userRole === 'Admin' || userRole === 'Concepteur') {
      return true;
    }

    // Direct access to public files is allowed if they belong to the same company,
    // or if they are public system resources.
    if (!file.isPrivate) {
      return file.companyId === companyId;
    }

    // Private files require strict tenant matching
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
    const db = this.getFilesDb();
    const file = db[fileId];

    if (!file) {
      return null;
    }

    if (!this.verifyAccess(file, companyId, userRole)) {
      throw new Error('Unauthorized access: Tenant isolation conflict.');
    }

    if (file.provider === 'local') {
      const filePath = path.join(this.localDir, file.filename);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const buffer = await fs.promises.readFile(filePath);
      return {
        buffer,
        mimetype: file.mimetype,
        originalname: file.originalname
      };
    } else if (this.s3Client) {
      const command = new GetObjectCommand({
        Bucket: file.bucket || this.bucketName,
        Key: file.keyPath
      });
      const response = await this.s3Client.send(command);
      if (!response.Body) {
        return null;
      }
      // Read stream to buffer
      const streamToBuffer = async (stream: any): Promise<Buffer> => {
        const chunks: any[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      };
      const buffer = await streamToBuffer(response.Body);
      return {
        buffer,
        mimetype: file.mimetype,
        originalname: file.originalname
      };
    }

    return null;
  }

  /**
   * Generate secure access URL (returns proxy download link for local/private files or S3 presigned URL for cloud)
   */
  public async getDownloadUrl(
    fileId: string,
    companyId: string,
    userRole: string
  ): Promise<string> {
    const db = this.getFilesDb();
    const file = db[fileId];

    if (!file) {
      throw new Error('File not found.');
    }

    if (!this.verifyAccess(file, companyId, userRole)) {
      throw new Error('Unauthorized access: Tenant isolation conflict.');
    }

    // If it's local or private, we route via our secure proxy endpoint
    if (file.provider === 'local' || file.isPrivate) {
      return `/api/storage/files/${fileId}/download`;
    }

    // For public files in S3/MinIO/R2, if public URL is configured, use it, otherwise generate a temporary link
    if (process.env.STORAGE_S3_PUBLIC_URL_PREFIX) {
      return `${process.env.STORAGE_S3_PUBLIC_URL_PREFIX}/${file.keyPath}`;
    }

    if (this.s3Client) {
      const command = new GetObjectCommand({
        Bucket: file.bucket || this.bucketName,
        Key: file.keyPath
      });
      // Generate standard presigned link valid for 1 hour
      return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    }

    return `/api/storage/files/${fileId}/download`;
  }

  /**
   * List files for a company with tenant isolation
   */
  public async listFiles(companyId: string, userRole: string): Promise<StoredFileMetadata[]> {
    const db = this.getFilesDb();
    const list = Object.values(db);

    // Filter by company/tenant
    if (userRole === 'Super Admin' || userRole === 'Admin') {
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
    const db = this.getFilesDb();
    const file = db[fileId];

    if (!file) {
      return false;
    }

    if (!this.verifyAccess(file, companyId, userRole)) {
      throw new Error('Unauthorized access: Tenant isolation conflict.');
    }

    try {
      if (file.provider === 'local') {
        const filePath = path.join(this.localDir, file.filename);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } else if (this.s3Client) {
        const command = new DeleteObjectCommand({
          Bucket: file.bucket || this.bucketName,
          Key: file.keyPath
        });
        await this.s3Client.send(command);
      }
    } catch (err) {
      console.error(`[STORAGE SERVICE] Error deleting physical file ${fileId}:`, err);
    }

    delete db[fileId];
    this.saveFilesDb(db);
    return true;
  }
}

export const storageService = new StorageService();
