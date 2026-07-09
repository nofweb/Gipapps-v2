import { useApi } from '~/composables/useApi'

/** Raw shape returned by POST /upload-file. */
interface UploadFileResponse {
  data?: { file_url?: string }
  file_url?: string
}

/**
 * File upload against the shared backend.
 *
 *   const { uploadFile } = useUpload()
 *   const url = await uploadFile(file)
 */
export function useUpload() {
  /**
   * POST /upload-file — multipart form with the file and a target folder.
   * Returns the hosted file URL from the response.
   */
  async function uploadFile(file: File, folder = 'GIPapps-v2'): Promise<string> {
    const api = useApi()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const { data } = await api.post<UploadFileResponse>('/upload-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const url = data?.data?.file_url ?? data?.file_url
    if (!url) throw new Error('Upload failed. Please try again.')
    return url
  }

  return { uploadFile }
}
