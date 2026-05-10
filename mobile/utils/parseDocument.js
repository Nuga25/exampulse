import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

const BACKEND_URL = 'http://172.20.10.2:3000';

export const pickAndParseCourseForm = async () => {
  try {
    // Open document picker
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const file = result.assets[0];
    console.log('File picked:', file.name, file.uri);

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(file.uri, {
      encoding: 'base64',
    });

    console.log('Base64 length:', base64.length);

    // Send to backend
    const response = await fetch(`${BACKEND_URL}/api/parse/course-form`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfBase64: base64 }),
    });

    const data = await response.json();
    console.log('Parse result:', JSON.stringify(data).slice(0, 200));

    if (!data.success) throw new Error(data.error || 'Parse failed');

    return data.data;

  } catch (error) {
    console.error('Document parse error:', error);
    throw error;
  }
};