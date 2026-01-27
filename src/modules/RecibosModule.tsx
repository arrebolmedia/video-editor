import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { generateReceiptPDF } from '../utils/receiptPDFGenerator';

interface Recibo {
  id: number;
  contrato_id?: number;
  client_name: string;
  client_email: string;
  receipt_number: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  concept: string;
  notes?: string;
  venue?: string;
  event_date?: string;
  created_at: string;
}

interface Contrato {
  id: number;
  client_name: string;
  client_email: string;
  total_amount: number;
  deposit_amount: number;
  wedding_date: string;
  venue?: string;
  package_type?: string;
}

const API_BASE = '/api';

export default function RecibosModule() {
  const toast = useToast();
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [filteredRecibos, setFilteredRecibos] = useState<Recibo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecibo, setCurrentRecibo] = useState<Partial<Recibo>>({
    payment_method: 'Transferencia',
    payment_date: new Date().toISOString().split('T')[0],
    concept: 'Anticipo - Servicio de fotografía y video',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecibos();
    fetchContratos();
  }, []);

  useEffect(() => {
    const filtered = recibos.filter(
      (r) =>
        r.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.client_email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRecibos(filtered);
  }, [searchTerm, recibos]);

  const fetchRecibos = async () => {
    try {
      const response = await fetch(`${API_BASE}/recibos`);
      const data = await response.json();
      // Ordenar por fecha de creación más reciente primero
      const sorted = data.sort((a: Recibo, b: Recibo) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setRecibos(sorted);
    } catch (error) {
      console.error('Error fetching recibos:', error);
    }
  };

  const fetchContratos = async () => {
    try {
      const response = await fetch(`${API_BASE}/contratos`);
      const data = await response.json();
      setContratos(data);
    } catch (error) {
      console.error('Error fetching contratos:', error);
    }
  };

  const generateReceiptNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `REC-${year}${month}-${random}`;
  };

  const handleCreate = () => {
    setIsEditing(false);
    setCurrentRecibo({
      payment_method: 'Transferencia',
      payment_date: new Date().toISOString().split('T')[0],
      concept: 'Anticipo - Servicio de fotografía y video',
      receipt_number: generateReceiptNumber(),
    });
    setIsModalOpen(true);
  };

  const handleEdit = (recibo: Recibo) => {
    setIsEditing(true);
    // Asegurar que las fechas estén en formato YYYY-MM-DD para los inputs
    const reciboEditado = {
      ...recibo,
      payment_date: recibo.payment_date ? recibo.payment_date.split('T')[0] : '',
      event_date: recibo.event_date ? recibo.event_date.split('T')[0] : ''
    };
    setCurrentRecibo(reciboEditado);
    setIsModalOpen(true);
  };

  const handleContratoChange = (contratoId: string) => {
    if (!contratoId) {
      setCurrentRecibo({ ...currentRecibo, contrato_id: undefined });
      return;
    }

    const contrato = contratos.find((c) => c.id === parseInt(contratoId));
    if (contrato) {
      // Generar concepto descriptivo basado en el paquete
      const packageDesc = contrato.package_type || 'Paquete';
      const conceptoSugerido = `Anticipo - ${packageDesc} - Servicio de fotografía y video`;
      
      setCurrentRecibo({
        ...currentRecibo,
        contrato_id: contrato.id,
        client_name: contrato.client_name,
        client_email: contrato.client_email,
        amount: contrato.deposit_amount,
        venue: contrato.venue || '',
        event_date: contrato.wedding_date || '',
        concept: conceptoSugerido,
      });
    }
  };

  const handleSave = async () => {
    console.log('handleSave called, currentRecibo:', currentRecibo);
    
    if (!currentRecibo.client_name || !currentRecibo.amount || !currentRecibo.receipt_number) {
      toast.warning('Por favor completa los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const url = isEditing
        ? `${API_BASE}/recibos/${currentRecibo.id}`
        : `${API_BASE}/recibos`;

      console.log('Enviando a:', url, 'Método:', isEditing ? 'PUT' : 'POST');
      console.log('Datos a enviar:', currentRecibo);

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentRecibo),
      }).catch(err => {
        console.error('Fetch error:', err);
        throw err;
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Response data:', responseData);
        await fetchRecibos();
        setIsModalOpen(false);
        setCurrentRecibo({
          payment_method: 'Transferencia',
          payment_date: new Date().toISOString().split('T')[0],
          concept: 'Anticipo - Servicio de fotografía y video',
        });
        toast.success(isEditing ? 'Recibo actualizado exitosamente' : 'Recibo creado exitosamente');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error response:', errorData);
        toast.error('Error al guardar el recibo: ' + (errorData.error || response.statusText));
      }
    } catch (error) {
      console.error('Error saving recibo:', error);
      toast.error('Error al guardar el recibo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/recibos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchRecibos();
        toast.success('Recibo eliminado exitosamente');
      } else {
        toast.error('Error al eliminar el recibo');
      }
    } catch (error) {
      console.error('Error deleting recibo:', error);
      toast.error('Error al eliminar el recibo');
    }
  };

  const handleDownloadPDF = async (recibo: Recibo) => {
    try {
      console.log('Datos del recibo para PDF:', {
        payment_date: recibo.payment_date,
        event_date: recibo.event_date,
        recibo_completo: recibo
      });
      
      // Normalizar fechas antes de enviar al generador
      const payment_date = recibo.payment_date ? recibo.payment_date.split('T')[0] : '';
      const event_date = recibo.event_date ? recibo.event_date.split('T')[0] : '';
      
      generateReceiptPDF({
        receipt_number: recibo.receipt_number,
        client_name: recibo.client_name,
        client_email: recibo.client_email,
        amount: recibo.amount,
        payment_method: recibo.payment_method,
        payment_date: payment_date,
        concept: recibo.concept,
        notes: recibo.notes,
        venue: recibo.venue,
        event_date: event_date,
      });
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar PDF');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <toast.ToastContainer />
      <div className="main-container py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Recibos de Pago</h1>
            <p className="text-gray-600 mt-2">Genera y administra recibos de pago</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition flex items-center gap-2"
          >
            <span>+</span> Nuevo Recibo
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por cliente o número de recibo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>

        {/* Recibos List */}
        <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="text-left p-4">Número</th>
                <th className="text-left p-4">Cliente</th>
                <th className="text-left p-4">Fecha</th>
                <th className="text-left p-4">Concepto</th>
                <th className="text-left p-4">Método</th>
                <th className="text-left p-4">Monto</th>
                <th className="text-left p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecibos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    {recibos.length === 0
                      ? 'No hay recibos aún. Crea uno para empezar.'
                      : 'No se encontraron recibos con los filtros aplicados.'}
                  </td>
                </tr>
              ) : (
                filteredRecibos.map((recibo) => (
                  <tr key={recibo.id} className="border-b border-stone-200 hover:bg-stone-50 transition">
                    <td className="p-4">
                      <div className="font-mono text-sm font-semibold text-gray-800">
                        {recibo.receipt_number}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-gray-800">{recibo.client_name}</div>
                        <div className="text-xs text-gray-500">{recibo.client_email}</div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {new Date(recibo.payment_date).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="p-4 text-gray-600 max-w-xs">
                      <div className="line-clamp-2 text-sm" title={recibo.concept}>
                        {recibo.concept}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{recibo.payment_method}</td>
                    <td className="p-4 font-semibold text-gray-800">
                      {formatCurrency(recibo.amount)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadPDF(recibo)}
                          className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition"
                          title="Descargar PDF"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => handleEdit(recibo)}
                          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(recibo.id)}
                          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Stats */}
        {recibos.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-stone-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Total Recibos</div>
              <div className="text-2xl font-bold text-gray-800">{recibos.length}</div>
            </div>
            <div className="bg-white rounded-lg border border-stone-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Total Recaudado</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(recibos.reduce((sum, r) => sum + (Number(r.amount) || 0), 0))}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-stone-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Este Mes</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(
                  recibos
                    .filter((r) => {
                      const date = new Date(r.payment_date);
                      const now = new Date();
                      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    })
                    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">
              {isEditing ? 'Editar Recibo' : 'Nuevo Recibo'}
            </h3>

            <div className="space-y-4">
              {/* Link to Contract */}
              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vincular con Contrato (opcional)
                  </label>
                  <select
                    value={currentRecibo.contrato_id || ''}
                    onChange={(e) => handleContratoChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  >
                    <option value="">Sin vincular</option>
                    {contratos.map((contrato) => (
                      <option key={contrato.id} value={contrato.id}>
                        {contrato.client_name} - {new Date(contrato.wedding_date).toLocaleDateString('es-MX')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Receipt Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Recibo *
                </label>
                <input
                  type="text"
                  value={currentRecibo.receipt_number || ''}
                  onChange={(e) =>
                    setCurrentRecibo({ ...currentRecibo, receipt_number: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700 font-mono"
                />
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    value={currentRecibo.client_name || ''}
                    onChange={(e) =>
                      setCurrentRecibo({ ...currentRecibo, client_name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={currentRecibo.client_email || ''}
                    onChange={(e) =>
                      setCurrentRecibo({ ...currentRecibo, client_email: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                </div>
              </div>

              {/* Venue y Fecha del Evento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue del Evento
                  </label>
                  <input
                    type="text"
                    value={currentRecibo.venue || ''}
                    onChange={(e) =>
                      setCurrentRecibo({ ...currentRecibo, venue: e.target.value })
                    }
                    placeholder="Ej: Hacienda Santa Rosa"
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha del Evento
                  </label>
                  <input
                    type="date"
                    value={currentRecibo.event_date || ''}
                    onChange={(e) =>
                      setCurrentRecibo({ ...currentRecibo, event_date: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto *
                  </label>
                  <input
                    type="number"
                    value={currentRecibo.amount || 0}
                    onChange={(e) =>
                      setCurrentRecibo({
                        ...currentRecibo,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Pago
                  </label>
                  <input
                    type="date"
                    value={currentRecibo.payment_date || ''}
                    onChange={(e) =>
                      setCurrentRecibo({ ...currentRecibo, payment_date: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago
                  </label>
                  <select
                    value={currentRecibo.payment_method || 'Transferencia'}
                    onChange={(e) =>
                      setCurrentRecibo({ ...currentRecibo, payment_method: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  >
                    <option value="Transferencia">Transferencia</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Concept */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concepto *
                </label>
                <textarea
                  value={currentRecibo.concept || ''}
                  onChange={(e) =>
                    setCurrentRecibo({ ...currentRecibo, concept: e.target.value })
                  }
                  placeholder="Ej: Anticipo - Colección Uno - Servicio de fotografía y video"
                  rows={2}
                  className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  Describe el tipo de pago y servicio (Anticipo, Pago Final, etc.)
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                <textarea
                  value={currentRecibo.notes || ''}
                  onChange={(e) =>
                    setCurrentRecibo({ ...currentRecibo, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setCurrentRecibo({
                    payment_method: 'Transferencia',
                    payment_date: new Date().toISOString().split('T')[0],
                    concept: 'Anticipo',
                  });
                }}
                className="px-6 py-2 bg-stone-100 hover:bg-stone-200 text-gray-700 rounded-lg font-medium transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
              >
                {loading ? 'Guardando...' : 'Guardar Recibo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
