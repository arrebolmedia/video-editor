import jsPDF from 'jspdf';

interface ReceiptData {
  receipt_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  concept: string;
  notes?: string;
  venue?: string;
  event_date?: string;
}

const PROVIDER_NAME = 'ANTHONY CAZARES';
const PROVIDER_COMPANY = 'ARREBOL WEDDINGS';
const PROVIDER_RFC = 'CAOA940915H99';
const PROVIDER_ADDRESS = 'Cuernavaca, Morelos, México';

// Función para convertir números a texto en español
function numberToText(num: number): string {
  if (num === 0) return 'CERO';
  
  const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function convertirGrupo(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';
    
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    
    let resultado = '';
    
    if (c > 0) resultado += centenas[c];
    
    if (d === 1 && u !== 0) {
      if (resultado) resultado += ' ';
      resultado += especiales[u];
    } else {
      if (d === 2 && u !== 0) {
        if (resultado) resultado += ' ';
        resultado += 'VEINTI' + unidades[u];
      } else {
        if (d > 0) {
          if (resultado) resultado += ' ';
          resultado += decenas[d];
        }
        if (u > 0) {
          if (d > 0) resultado += ' Y ';
          else if (resultado) resultado += ' ';
          resultado += unidades[u];
        }
      }
    }
    
    return resultado;
  }

  const miles = Math.floor(num / 1000);
  const resto = num % 1000;
  
  let resultado = '';
  
  if (miles > 0) {
    if (miles === 1) {
      resultado = 'MIL';
    } else {
      resultado = convertirGrupo(miles) + ' MIL';
    }
  }
  
  if (resto > 0) {
    if (resultado) resultado += ' ';
    resultado += convertirGrupo(resto);
  }
  
  return resultado;
}

export function generateReceiptPDF(data: ReceiptData) {
  const doc = new jsPDF({
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 28.35; // 1cm en puntos
  const contentWidth = pageWidth - (2 * margin);
  let yPos = margin;

  // Configurar fuente Times New Roman
  doc.setFont('times', 'normal');

  const addSpace = (space: number) => {
    yPos += space;
  };

  const addText = (text: string, fontSize: number, isBold: boolean = false, align: 'left' | 'center' | 'right' | 'justify' = 'left') => {
    doc.setFontSize(fontSize);
    doc.setFont('times', isBold ? 'bold' : 'normal');
    
    if (align === 'center' || align === 'right') {
      const x = align === 'center' ? pageWidth / 2 : pageWidth - margin;
      doc.text(text, x, yPos, { align });
    } else {
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, yPos, { 
        maxWidth: contentWidth,
        align: align === 'justify' ? 'justify' : 'left'
      });
      yPos += (lines.length - 1) * fontSize * 0.5;
    }
    
    yPos += fontSize * 0.5;
  };

  // ENCABEZADO
  doc.setFontSize(18);
  doc.setFont('times', 'bold');
  doc.text('RECIBO DE PAGO', pageWidth / 2, yPos, { align: 'center' });
  addSpace(15);

  // Información del proveedor
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text(PROVIDER_COMPANY, pageWidth / 2, yPos, { align: 'center' });
  addSpace(8);
  
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(PROVIDER_NAME, pageWidth / 2, yPos, { align: 'center' });
  addSpace(6);
  doc.text(PROVIDER_ADDRESS, pageWidth / 2, yPos, { align: 'center' });
  addSpace(15);

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  addSpace(10);

  // Información del recibo en dos columnas
  const leftCol = margin;
  const rightCol = pageWidth / 2 + 10;
  
  doc.setFontSize(10);
  doc.setFont('times', 'bold');
  doc.text('Recibo No.:', leftCol, yPos);
  doc.setFont('times', 'normal');
  doc.text(data.receipt_number, leftCol + 25, yPos);
  
  doc.setFont('times', 'bold');
  doc.text('Fecha:', rightCol, yPos);
  doc.setFont('times', 'normal');
  // Parsear fecha en formato YYYY-MM-DD como fecha local
  const [year, month, day] = data.payment_date.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);
  const fechaTexto = fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(fechaTexto, rightCol + 20, yPos);
  addSpace(8);

  doc.setFont('times', 'bold');
  doc.text('Cliente:', leftCol, yPos);
  doc.setFont('times', 'normal');
  doc.text(data.client_name, leftCol + 25, yPos);
  addSpace(8);

  // Venue del evento
  if (data.venue) {
    doc.setFont('times', 'bold');
    doc.text('Venue:', leftCol, yPos);
    doc.setFont('times', 'normal');
    doc.text(data.venue, leftCol + 25, yPos);
    addSpace(8);
  }

  // Fecha del evento
  if (data.event_date) {
    doc.setFont('times', 'bold');
    doc.text('Fecha del Evento:', leftCol, yPos);
    doc.setFont('times', 'normal');
    // Parsear fecha en formato YYYY-MM-DD como fecha local
    const [eventYear, eventMonth, eventDay] = data.event_date.split('-').map(Number);
    const eventFecha = new Date(eventYear, eventMonth - 1, eventDay);
    const eventFechaTexto = eventFecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(eventFechaTexto, leftCol + 40, yPos);
    addSpace(8);
  }

  addSpace(7);

  // Línea separadora
  doc.line(margin, yPos, pageWidth - margin, yPos);
  addSpace(10);

  // Concepto y método de pago
  doc.setFont('times', 'bold');
  doc.text('Concepto:', leftCol, yPos);
  doc.setFont('times', 'normal');
  const conceptLines = doc.splitTextToSize(data.concept, contentWidth - 30);
  doc.text(conceptLines, leftCol + 25, yPos);
  yPos += conceptLines.length * 5;
  addSpace(8);

  doc.setFont('times', 'bold');
  doc.text('Método de Pago:', leftCol, yPos);
  doc.setFont('times', 'normal');
  doc.text(data.payment_method, leftCol + 35, yPos);
  addSpace(15);

  // Línea separadora
  doc.line(margin, yPos, pageWidth - margin, yPos);
  addSpace(10);

  // Monto - destacado
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text('MONTO RECIBIDO:', leftCol, yPos);
  const amountText = `$${data.amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  doc.text(amountText, pageWidth - margin, yPos, { align: 'right' });
  addSpace(10);

  // Monto en letra
  doc.setFontSize(10);
  doc.setFont('times', 'italic');
  const amountInWords = `(${numberToText(data.amount)} PESOS 00/100 M.N.)`;
  doc.text(amountInWords, pageWidth / 2, yPos, { align: 'center' });
  addSpace(15);

  // Notas si existen
  if (data.notes && data.notes.trim() !== '') {
    doc.setFont('times', 'bold');
    doc.text('Notas:', leftCol, yPos);
    addSpace(6);
    doc.setFont('times', 'normal');
    const notesLines = doc.splitTextToSize(data.notes, contentWidth);
    doc.text(notesLines, leftCol, yPos);
    yPos += notesLines.length * 5;
    addSpace(10);
  }

  // Espacio para firma - más arriba para evitar solapamiento
  addSpace(20);
  doc.line(margin + 50, yPos, pageWidth - margin - 50, yPos);
  addSpace(6);
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('Anthony Cazares', pageWidth / 2, yPos, { align: 'center' });
  
  // Pie de página
  yPos = pageHeight - 30;
  doc.setFontSize(8);
  doc.setFont('times', 'italic');
  doc.text('Este recibo es un comprobante de pago. Consérvelo para cualquier aclaración.', pageWidth / 2, yPos, { align: 'center' });
  addSpace(4);
  doc.text(`Generado el ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, yPos, { align: 'center' });

  // Descargar PDF
  doc.save(`${data.receipt_number}.pdf`);
}
