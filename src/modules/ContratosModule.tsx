import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { generateContractPDF } from '../utils/contractPDFGenerator';

interface Contrato {
  id: number;
  project_id?: number;
  project_name?: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_address?: string;
  wedding_date: string;
  venue: string;
  venue_address?: string;
  package_type: string;
  coverage_hours: number;
  photographers_count: number;
  videographers_count: number;
  photos_quantity: string;
  deliverables: string[];
  total_amount: number;
  deposit_amount: number;
  second_payment_date?: string;
  travel_expenses: boolean;
  meals_count: number;
  deposit_paid: boolean;
  balance_paid: boolean;
  status: 'draft' | 'sent' | 'signed' | 'cancelled';
  contract_date: string;
  notes?: string;
  special_notes?: string;
  created_at: string;
  updated_at: string;
}

const API_BASE = '/api';

export default function ContratosModule() {
  const toast = useToast();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [filteredContratos, setFilteredContratos] = useState<Contrato[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentContrato, setCurrentContrato] = useState<Partial<Contrato>>({
    status: 'draft',
    deposit_paid: false,
    balance_paid: false,
    package_type: 'Básico',
    total_amount: 0,
    deposit_amount: 0,
    coverage_hours: 10,
    photographers_count: 1,
    videographers_count: 1,
    photos_quantity: '600-700',
    deliverables: [],
    travel_expenses: false,
    meals_count: 3,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContratos();
  }, []);

  useEffect(() => {
    let filtered = contratos;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.project_name && c.project_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((c) => c.status === filterStatus);
    }

    setFilteredContratos(filtered);
  }, [searchTerm, filterStatus, contratos]);

  const fetchContratos = async () => {
    try {
      const response = await fetch(`${API_BASE}/contratos`);
      const data = await response.json();
      setContratos(data);
    } catch (error) {
      console.error('Error fetching contratos:', error);
    }
  };

  const handleCreate = () => {
    setIsEditing(false);
    setCurrentContrato({
      status: 'draft',
      deposit_paid: false,
      balance_paid: false,
      package_type: 'Básico',
      total_amount: 0,
      deposit_amount: 0,
      coverage_hours: 10,
      photographers_count: 1,
      videographers_count: 1,
      photos_quantity: '600-700',
      deliverables: [],
      travel_expenses: false,
      meals_count: 3,
      contract_date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (contrato: Contrato) => {
    setIsEditing(true);
    setCurrentContrato(contrato);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!currentContrato.client_name || !currentContrato.client_email || !currentContrato.wedding_date) {
      toast.warning('Por favor completa los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const url = isEditing
        ? `${API_BASE}/contratos/${currentContrato.id}`
        : `${API_BASE}/contratos`;
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentContrato),
      });

      if (response.ok) {
        await fetchContratos();
        setIsModalOpen(false);
        setCurrentContrato({
          status: 'draft',
          deposit_paid: false,
          balance_paid: false,
          package_type: 'Básico',
          total_amount: 0,
          deposit_amount: 0,
        });
        toast.success(isEditing ? 'Contrato actualizado exitosamente' : 'Contrato creado exitosamente');
      } else {
        toast.error('Error al guardar el contrato');
      }
    } catch (error) {
      console.error('Error saving contrato:', error);
      toast.error('Error al guardar el contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = (contrato: Contrato) => {
    try {
      generateContractPDF({
        client_name: contrato.client_name,
        client_address: contrato.client_address || '',
        wedding_date: contrato.wedding_date,
        venue: contrato.venue,
        venue_address: contrato.venue_address || '',
        coverage_hours: contrato.coverage_hours,
        photographers_count: contrato.photographers_count,
        videographers_count: contrato.videographers_count,
        photos_quantity: contrato.photos_quantity,
        deliverables: contrato.deliverables || [],
        total_amount: contrato.total_amount,
        deposit_amount: contrato.deposit_amount,
        second_payment_date: contrato.second_payment_date || '',
        travel_expenses: contrato.travel_expenses,
        meals_count: contrato.meals_count,
        contract_date: contrato.contract_date,
        special_notes: contrato.special_notes,
      });
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/contratos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Contrato eliminado exitosamente');
      } else {
        toast.error('Error al eliminar el contrato');
      }
    } catch (error) {
      console.error('Error deleting contrato:', error);
      toast.error('Error al eliminar el contrato');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      signed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    const labels = {
      draft: 'Borrador',
      sent: 'Enviado',
      signed: 'Firmado',
      cancelled: 'Cancelado',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  return (
    <>
      <toast.ToastContainer />
      <div className="min-h-screen bg-stone-50">
        <div className="main-container py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Contratos</h1>
            <p className="text-gray-600 mt-2">Administra contratos y pagos de clientes</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition flex items-center gap-2"
          >
            <span>+</span> Nuevo Contrato
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Buscar por cliente o proyecto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="sent">Enviado</option>
            <option value="signed">Firmado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        {/* Contracts List */}
        <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="text-left p-4">Cliente</th>
                <th className="text-left p-4">Proyecto</th>
                <th className="text-left p-4">Fecha Boda</th>
                <th className="text-left p-4">Paquete</th>
                <th className="text-left p-4">Monto Total</th>
                <th className="text-left p-4">Anticipo</th>
                <th className="text-left p-4">Estado</th>
                <th className="text-left p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredContratos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    {contratos.length === 0
                      ? 'No hay contratos aún. Crea uno para empezar.'
                      : 'No se encontraron contratos con los filtros aplicados.'}
                  </td>
                </tr>
              ) : (
                filteredContratos.map((contrato) => (
                  <tr key={contrato.id} className="border-b border-stone-200 hover:bg-stone-50 transition">
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-gray-800">{contrato.client_name}</div>
                        <div className="text-xs text-gray-500">{contrato.client_email}</div>
                        <div className="text-xs text-gray-500">{contrato.client_phone}</div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {contrato.project_name || '-'}
                    </td>
                    <td className="p-4 text-gray-600">
                      {new Date(contrato.wedding_date).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="p-4 text-gray-600">{contrato.package_type}</td>
                    <td className="p-4 font-semibold text-gray-800">
                      {formatCurrency(contrato.total_amount)}
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div className="text-gray-800">{formatCurrency(contrato.deposit_amount)}</div>
                        <div className="text-xs">
                          {contrato.deposit_paid ? (
                            <span className="text-green-600">✓ Pagado</span>
                          ) : (
                            <span className="text-orange-600">⏱ Pendiente</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(contrato.status)}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleGeneratePDF(contrato)}
                          className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition"
                          title="Generar PDF"
                        >
                          📄 PDF
                        </button>
                        <button
                          onClick={() => handleEdit(contrato)}
                          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(contrato.id)}
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
        {contratos.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-stone-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Total Contratos</div>
              <div className="text-2xl font-bold text-gray-800">{contratos.length}</div>
            </div>
            <div className="bg-white rounded-lg border border-stone-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Firmados</div>
              <div className="text-2xl font-bold text-green-600">
                {contratos.filter((c) => c.status === 'signed').length}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-stone-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Pendientes</div>
              <div className="text-2xl font-bold text-orange-600">
                {contratos.filter((c) => c.status === 'sent' || c.status === 'draft').length}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-stone-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Ingresos Totales</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(contratos.reduce((sum, c) => sum + c.total_amount, 0))}
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
              {isEditing ? 'Editar Contrato' : 'Nuevo Contrato'}
            </h3>

            <div className="space-y-4">
              {/* Client Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    value={currentContrato.client_name || ''}
                    onChange={(e) =>
                      setCurrentContrato({ ...currentContrato, client_name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={currentContrato.client_email || ''}
                    onChange={(e) =>
                      setCurrentContrato({ ...currentContrato, client_email: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={currentContrato.client_phone || ''}
                    onChange={(e) =>
                      setCurrentContrato({ ...currentContrato, client_phone: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Boda *
                  </label>
                  <input
                    type="date"
                    value={currentContrato.wedding_date || ''}
                    onChange={(e) =>
                      setCurrentContrato({ ...currentContrato, wedding_date: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lugar del Evento
                </label>
                <input
                  type="text"
                  value={currentContrato.venue || ''}
                  onChange={(e) =>
                    setCurrentContrato({ ...currentContrato, venue: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                />
              </div>

              {/* Package Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paquete
                  </label>
                  <select
                    value={currentContrato.package_type || 'Básico'}
                    onChange={(e) =>
                      setCurrentContrato({ ...currentContrato, package_type: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  >
                    <option value="Básico">Básico</option>
                    <option value="Completo">Completo</option>
                    <option value="Premium">Premium</option>
                    <option value="Personalizado">Personalizado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={currentContrato.status || 'draft'}
                    onChange={(e) =>
                      setCurrentContrato({ ...currentContrato, status: e.target.value as any })
                    }
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  >
                    <option value="draft">Borrador</option>
                    <option value="sent">Enviado</option>
                    <option value="signed">Firmado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Financial Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Total
                  </label>
                  <input
                    type="number"
                    value={currentContrato.total_amount || 0}
                    onChange={(e) =>
                      setCurrentContrato({
                        ...currentContrato,
                        total_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anticipo
                  </label>
                  <input
                    type="number"
                    value={currentContrato.deposit_amount || 0}
                    onChange={(e) =>
                      setCurrentContrato({
                        ...currentContrato,
                        deposit_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="deposit_paid"
                    checked={currentContrato.deposit_paid || false}
                    onChange={(e) =>
                      setCurrentContrato({ ...currentContrato, deposit_paid: e.target.checked })
                    }
                    className="rounded accent-gray-700 mr-2"
                  />
                  <label htmlFor="deposit_paid" className="text-sm text-gray-700">
                    Anticipo pagado
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="balance_paid"
                    checked={currentContrato.balance_paid || false}
                    onChange={(e) =>
                      setCurrentContrato({ ...currentContrato, balance_paid: e.target.checked })
                    }
                    className="rounded accent-gray-700 mr-2"
                  />
                  <label htmlFor="balance_paid" className="text-sm text-gray-700">
                    Saldo pagado
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={currentContrato.notes || ''}
                  onChange={(e) =>
                    setCurrentContrato({ ...currentContrato, notes: e.target.value })
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
                  setCurrentContrato({
                    status: 'draft',
                    deposit_paid: false,
                    balance_paid: false,
                    package_type: 'Básico',
                    total_amount: 0,
                    deposit_amount: 0,
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
                {loading ? 'Guardando...' : 'Guardar Contrato'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
