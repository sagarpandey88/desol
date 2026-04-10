import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

function sanitizeFilename(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'diagram'
  );
}

export async function captureElementAsPng(
  element: HTMLElement
): Promise<string> {
  return toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: getComputedStyle(document.body).backgroundColor,
  });
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function exportElementAsImage(
  element: HTMLElement,
  diagramName: string
): Promise<void> {
  const dataUrl = await captureElementAsPng(element);
  downloadDataUrl(dataUrl, `${sanitizeFilename(diagramName)}.png`);
}

export async function exportElementAsPdf(
  element: HTMLElement,
  diagramName: string
): Promise<void> {
  const dataUrl = await captureElementAsPng(element);
  const image = new Image();
  image.src = dataUrl;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Unable to prepare PDF export'));
  });

  const orientation = image.width >= image.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'px', format: [image.width, image.height] });
  pdf.addImage(dataUrl, 'PNG', 0, 0, image.width, image.height);
  pdf.save(`${sanitizeFilename(diagramName)}.pdf`);
}