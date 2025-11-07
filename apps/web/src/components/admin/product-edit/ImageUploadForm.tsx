import FileUpload from '../../../components/ui/FileUpload';
import type { Dictionary } from '../../../lib/i18n';

interface ImageUploadFormProps {
  productId: string;
  dict: Dictionary;
  uploadImage: (formData: FormData) => Promise<void>;
}

export function ImageUploadForm({ productId, dict, uploadImage }: ImageUploadFormProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
        {dict.admin?.products?.images ?? 'Images'}
      </h2>
      <form action={uploadImage} className="space-y-4">
        <input type="hidden" name="id" value={productId} />
        <FileUpload name="image" label={dict.admin?.products?.uploadImage ?? 'Upload image'} />
        <div className="flex justify-end">
          <button className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors font-medium">
            {dict.common?.saveImage ?? 'Save Image'}
          </button>
        </div>
      </form>
    </div>
  );
}

