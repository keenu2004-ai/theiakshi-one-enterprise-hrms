import { config } from '../config/env';

export interface DocumentFolder {
  id: string;
  name: string;
  employeeId?: string;
  driveFolderId?: string;
  itemCount: number;
}

export class DocumentService {
  async getEmployeeFolder(employeeId: string): Promise<DocumentFolder> {
    return {
      id: `folder-${employeeId}`,
      name: `Employee Wallet - ${employeeId}`,
      employeeId,
      driveFolderId: config.googleDrive.clientId ? `gdrive_folder_${employeeId}` : undefined,
      itemCount: 4,
    };
  }

  async listFiles(employeeId: string) {
    return [
      {
        id: 'doc-1',
        name: 'Aadhaar_Card_Verified.pdf',
        type: 'application/pdf',
        category: 'GOVT',
        uploadDate: '2026-01-15',
        fileUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=300',
        encrypted: true,
      },
      {
        id: 'doc-2',
        name: 'PAN_Card_Verification.pdf',
        type: 'application/pdf',
        category: 'GOVT',
        uploadDate: '2026-01-15',
        fileUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=300',
        encrypted: true,
      },
      {
        id: 'doc-3',
        name: 'Employment_Offer_Letter.pdf',
        type: 'application/pdf',
        category: 'COMPANY',
        uploadDate: '2026-01-01',
        fileUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=300',
        encrypted: true,
      },
    ];
  }
}
