import jsPDF from 'jspdf';

interface ContratoData {
  client_name: string;
  client_address: string;
  wedding_date: string;
  venue: string;
  venue_address: string;
  coverage_hours: number;
  photographers_count: number;
  videographers_count: number;
  photos_quantity: string;
  deliverables: string[];
  total_amount: number;
  deposit_amount: number;
  second_payment_date: string;
  travel_expenses: boolean;
  meals_count: number;
  contract_date: string;
  special_notes?: string;
}

const PROVIDER_NAME = 'ANTHONY CAZARES';
const PROVIDER_COMPANY = 'ARREBOL MEDIA';
const PROVIDER_ADDRESS = 'Paseo de las Rosas #100, Ampliación Bugambilias, CP 62577, Jiutepec, Morelos';
const BANK_NAME = 'BANORTE';
const BANK_ACCOUNT = '0298412002';
const BANK_CLABE = '072540002984120026';

export function generateContractPDF(data: ContratoData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = 20;

  // Helper para añadir texto con salto de línea automático
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false, align: 'left' | 'center' | 'justify' = 'left') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    if (align === 'center') {
      doc.text(text, pageWidth / 2, y, { align: 'center' });
      y += fontSize * 0.5;
    } else {
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y, { align: align });
      y += lines.length * fontSize * 0.5;
    }
  };

  const addSpace = (space: number = 5) => {
    y += space;
  };

  const checkPageBreak = (neededSpace: number = 20) => {
    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      y = 20;
    }
  };

  // Calcular montos
  const balanceAmount = data.total_amount - data.deposit_amount;
  const totalAmountText = new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN' 
  }).format(data.total_amount);
  
  const depositAmountText = new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN' 
  }).format(data.deposit_amount);
  
  const balanceAmountText = new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN' 
  }).format(balanceAmount);

  // Convertir números a texto (simplificado)
  const numberToText = (num: number): string => {
    // Esta es una versión simplificada, se puede mejorar con una librería
    return `${num.toLocaleString('es-MX')}`;
  };

  // ENCABEZADO
  addText('CONTRATO DE PRESTACIÓN DE SERVICIOS', 12, true, 'center');
  addSpace(8);

  // INTRODUCCIÓN
  addText(`QUE CELEBRAN, POR UNA PARTE, ${PROVIDER_COMPANY}, REPRESENTADA POR ${PROVIDER_NAME} EN ESTE DOCUMENTO, A QUIEN EN LO SUCESIVO SE LE DENOMINARÁ EL PROVEEDOR, Y POR ${data.client_name.toUpperCase()}, A QUIEN EN LO SUCESIVO SE LE DENOMINARÁ EL CLIENTE EN CONSIDERACIÓN DE LAS SIGUIENTES:`, 10, false, 'justify');
  addSpace(8);

  // DECLARACIONES
  addText('DECLARACIONES', 11, true);
  addSpace(5);

  addText('A) Declara EL PROVEEDOR:', 10, true);
  addSpace(3);
  
  addText(`1. Llamarse ${PROVIDER_NAME}, quien se identifica con credencial de elector, ser de nacionalidad mexicana con domicilio en ${PROVIDER_ADDRESS}. Manifiesta ser persona física y representante legal de la marca ${PROVIDER_COMPANY}.`, 10, false, 'justify');
  addSpace(3);
  
  addText('2. Que cuenta con elementos propios, suficientes y capacidad profesional necesaria para cumplir las actividades profesionales que se le encomienden, por lo que está en condiciones de obligarse en este contrato para prestar sus servicios de fotografía a EL CLIENTE.', 10, false, 'justify');
  addSpace(5);

  addText('B) Declara EL CLIENTE:', 10, true);
  addSpace(3);
  
  addText(`1. Ser una persona física quien se identifica bajo el nombre de ${data.client_name.toUpperCase()}, que se identifica con credencial de elector, y manifiesta tener domicilio en ${data.client_address}. Desea hacer uso de los servicios de EL PROVEEDOR para desempeñar la actividad de Fotografía y Video Profesional en el evento social a celebrarse el día ${new Date(data.wedding_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })} en ${data.venue}, ubicada en ${data.venue_address}. Considerando EL PROVEEDOR y EL CLIENTE en mutuo acuerdo las siguientes:`, 10, false, 'justify');
  addSpace(8);

  checkPageBreak(40);

  // CLÁUSULAS
  addText('CLÁUSULAS', 11, true);
  addSpace(5);

  // CLÁUSULA PRIMERA
  addText('PRIMERA. - Sobre las características del servicio: en virtud del presente contrato, EL PROVEEDOR se obliga a prestar a EL CLIENTE el siguiente servicio:', 10, false, 'justify');
  addSpace(3);
  
  addText('Paquete de Fotografía y Videografía con las siguientes características:', 10, false);
  addSpace(3);
  
  addText(`• ${data.coverage_hours} horas de cobertura`, 10);
  addText(`• ${data.photographers_count} fotógrafo${data.photographers_count > 1 ? 's' : ''} y ${data.videographers_count} videógrafo${data.videographers_count > 1 ? 's' : ''}`, 10);
  addText(`• ${data.photos_quantity} fotografías`, 10);
  
  if (data.deliverables && data.deliverables.length > 0) {
    data.deliverables.forEach(item => {
      addText(`• ${item}`, 10);
    });
  }
  addSpace(5);

  checkPageBreak(30);

  // CLÁUSULAS ADICIONALES
  addText('PRIMERA BIS. - EL CLIENTE autoriza a EL PROVEEDOR a subcontratar al personal o equipo necesario para cumplir con las obligaciones presentadas en la cláusula anterior.', 10, false, 'justify');
  addSpace(5);

  addText('SEGUNDA. - EL CLIENTE autoriza a EL PROVEEDOR a utilizar el material con fines de mercadotecnia o publicidad. El material no podrá ser vendido a alguien que no sea EL CLIENTE.', 10, false, 'justify');
  addSpace(5);

  addText('SEGUNDA BIS. - El tiempo de entrega del material en formato digital se estima en cuatro y seis semanas.', 10, false, 'justify');
  addSpace(5);

  checkPageBreak(30);

  // CLÁUSULA TERCERA - COSTO
  addText(`TERCERA. - Sobre el costo acordado: el valor convenido por EL PROVEEDOR y EL CLIENTE es de ${totalAmountText} pesos MXN. En caso de requerir factura los precios son más IVA.`, 10, false, 'justify');
  addSpace(5);

  // CLÁUSULA CUARTA - FORMAS DE PAGO
  addText('CUARTA. - Sobre las formas de pago: EL CLIENTE se compromete a pagar a EL PROVEEDOR la cantidad total de la siguiente manera:', 10, false, 'justify');
  addSpace(3);
  
  addText(`PRIMER PAGO: Por la cantidad de ${depositAmountText} pesos MXN, a realizarse a la firma del presente contrato.`, 10, false, 'justify');
  addSpace(3);
  
  addText(`SEGUNDO PAGO: Por la cantidad de ${balanceAmountText} pesos MXN, a realizarse el día ${new Date(data.second_payment_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}.`, 10, false, 'justify');
  addSpace(3);
  
  addText(`VIÁTICOS: ${data.travel_expenses ? 'Aplican según lo acordado' : 'no aplican'}.`, 10, false, 'justify');
  addSpace(5);

  checkPageBreak(40);

  // CLÁUSULA QUINTA - MÉTODOS DE PAGO
  addText('QUINTA. - Sobre los métodos de pago: EL PROVEEDOR declara su deseo de recibir los pagos en la siguiente cuenta bancaria:', 10, false, 'justify');
  addSpace(3);
  
  addText(`BANCO: ${BANK_NAME}`, 10);
  addText(`TITULAR: ${PROVIDER_NAME}`, 10);
  addText(`NÚMERO DE CUENTA: ${BANK_ACCOUNT}`, 10);
  addText(`CLABE: ${BANK_CLABE}`, 10);
  addSpace(3);
  
  addText('De igual forma, EL CLIENTE podrá acordar con EL PROVEEDOR otro método de pago bajo mutuo acuerdo.', 10, false, 'justify');
  addSpace(5);

  // CLÁUSULAS SEXTA A DÉCIMA
  addText('SEXTA. - Se estipula que la vigencia del presente contrato será por el periodo que comprende a partir de la fecha en que EL CLIENTE realice el primer pago y hasta el día de la entrega de los productos que están contenidos en la CLÁUSULA PRIMERA.', 10, false, 'justify');
  addSpace(5);

  checkPageBreak(30);

  addText('SÉPTIMA. - En virtud de ser un contrato por tiempo determinado conforme a la cláusula que antecede, se estipula que en caso de que, si EL CLIENTE decide cancelar la prestación de servicios para con EL PROVEEDOR, motivo del presente instrumento, deberá informar su decisión a más tardar un mes antes de la fecha en que se prestará el servicio para poder recibir el 50% de los pagos realizados, de lo contrario no podrá hacerse devolución alguna del mismo.', 10, false, 'justify');
  addSpace(5);

  checkPageBreak(30);

  addText('OCTAVA. - En caso de que EL PROVEEDOR incumpla con la obligación de prestar los servicios convenidos en el presente instrumento, EL CLIENTE tendrá derecho a rescindir el presente contrato, recibiendo la totalidad de los pagos efectuados a EL PROVEEDOR, dejando en claro que la única razón por la cual puede incumplir es en caso de accidente, muerte o disposición sanitaria; en caso de esta última se podrá reagendar la prestación del servicio, sin penalización alguna, sujeto a disponibilidad por parte de EL PROVEEDOR.', 10, false, 'justify');
  addSpace(5);

  addText('OCTAVA BIS. - EL PROVEEDOR hace la petición especial a EL CLIENTE para no contratar iluminación de tipo láser durante el evento, debido a que estos pueden dañar los sensores del equipo de fotografía y video, impidiendo el cumplimiento adecuado de la captura del evento.', 10, false, 'justify');
  addSpace(5);

  checkPageBreak(30);

  addText('NOVENA. - En caso de reagendar, se respetará el precio del servicio hasta por un año posterior a la fecha original del evento, si se reagenda para una fecha transcurrido dicho lapso, el precio incrementará un 10%.', 10, false, 'justify');
  addSpace(5);

  addText(`DÉCIMA. - EL CLIENTE autoriza media hora para ingesta de alimentos y proveerá un servicio de comida para cada integrante asociado a EL PROVEEDOR (${data.meals_count} personas).`, 10, false, 'justify');
  addSpace(5);

  if (data.special_notes) {
    addText(`ONCEAVA. - ${data.special_notes}`, 10, false, 'justify');
    addSpace(5);
  }

  checkPageBreak(40);

  // CLÁUSULAS FINALES
  const clausulaNumero = data.special_notes ? 'DOCEAVA' : 'ONCEAVA';
  addText(`${clausulaNumero}. - Ambas partes contratantes declaran conformidad respecto a las obligaciones y derechos que mutuamente les corresponde en sus respectivas calidades de EL CLIENTE y EL PROVEEDOR, y que ante cualquier situación que no hayan sido motivo de cláusula expresa en el presente contrato, se podrá añadir en un anexo al presente previo convenio entre las partes.`, 10, false, 'justify');
  addSpace(5);

  const ultimaClausula = data.special_notes ? 'TRECEAVA' : 'DOCEAVA';
  addText(`${ultimaClausula}. - Jurisdicción y leyes en caso de controversia: las leyes aplicables y tribunales de la ciudad de Cuernavaca, Morelos.`, 10, false, 'justify');
  addSpace(8);

  // FIRMA
  checkPageBreak(60);
  
  addText(`Leído por ambas partes este documento y conocedores de las obligaciones que contraen, firman en versión digital o impresa en Cuernavaca, Morelos a ${new Date(data.contract_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}.`, 10, false, 'justify');
  addSpace(15);

  // Líneas de firma
  y += 20;
  doc.line(margin, y, margin + 70, y);
  doc.line(pageWidth - margin - 70, y, pageWidth - margin, y);
  
  y += 5;
  addText(data.client_name, 10, false, 'left');
  doc.text(PROVIDER_NAME, pageWidth - margin - 35, y, { align: 'center' });
  
  y += 5;
  addText('EL CLIENTE', 9, false, 'left');
  doc.text('EL PROVEEDOR', pageWidth - margin - 35, y, { align: 'center' });

  // Guardar PDF
  const fileName = `Contrato_${data.client_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
