import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { generateContractPDF } from '../utils/contractPDFGenerator';

interface Contrato {
  id: number;
  project_id?: number;
  project_name?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address: string;
  wedding_date: string;
  venue: string;
  venue_address?: string;
  package_type: string;
  coverage_hours: number;
  photographers_count: number;
  videographers_count: number;
  photos_quantity?: string;
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
  signed_contract_file?: string;
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
  const [savedVenues, setSavedVenues] = useState<Array<{name: string, address: string}>>([]); 
  const [showVenueSuggestions, setShowVenueSuggestions] = useState(false);
  const [depositPercentage, setDepositPercentage] = useState<number>(20);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [currentContrato, setCurrentContrato] = useState<Partial<Contrato>>({
    status: 'draft',
    deposit_paid: false,
    balance_paid: false,
    package_type: 'Colección Uno',
    total_amount: 59000,
    deposit_amount: 29500,
    coverage_hours: 8,
    photographers_count: 1,
    videographers_count: 1,
    deliverables: ['8 horas de cobertura', '1 fotógrafo', '400-500 fotografías', 'Galería digital', '1 videógrafo', 'Video de 20-25 minutos', 'Versión 1 minuto'],
    travel_expenses: false,
    meals_count: 3,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContratos();
    loadSavedVenues();
  }, []);

  const loadSavedVenues = () => {
    try {
      const saved = localStorage.getItem('savedVenues');
      if (saved) {
        setSavedVenues(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading venues:', error);
    }
  };

  const saveVenue = (name: string, address: string) => {
    if (!name.trim()) return;
    
    const newVenue = { name: name.trim(), address: address.trim() };
    const exists = savedVenues.some(v => v.name.toLowerCase() === newVenue.name.toLowerCase());
    
    if (!exists) {
      const updated = [...savedVenues, newVenue];
      setSavedVenues(updated);
      localStorage.setItem('savedVenues', JSON.stringify(updated));
    }
  };

  useEffect(() => {
    let filtered = contratos;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.client_email && c.client_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (c.project_name && c.project_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((c) => c.status === filterStatus);
    }

    // Sort by ID (creation order), newest first
    filtered.sort((a, b) => (b.id || 0) - (a.id || 0));

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
      package_type: 'Colección Uno',
      total_amount: 59000,
      deposit_amount: 11800,
      coverage_hours: 8,
      photographers_count: 1,
      videographers_count: 1,
      deliverables: ['8 horas de cobertura', '1 fotógrafo', '400-500 fotografías', 'Galería digital', '1 videógrafo', 'Video de 20-25 minutos', 'Versión 1 minuto'],
      travel_expenses: false,
      meals_count: 3,
      contract_date: new Date().toISOString().split('T')[0],
    });
    setBaseAmount(59000);
    setDiscountPercentage(0);
    setDepositPercentage(20);
    setIsModalOpen(true);
  };

  const handleEdit = (contrato: Contrato) => {
    setIsEditing(true);
    
    // Calcular second_payment_date si hay wedding_date y no está definido
    let secondPaymentDate = contrato.second_payment_date || '';
    if (contrato.wedding_date && !secondPaymentDate) {
      const eventDate = new Date(contrato.wedding_date + 'T00:00:00');
      eventDate.setDate(eventDate.getDate() - 15);
      secondPaymentDate = eventDate.toISOString().split('T')[0];
    }
    
    setCurrentContrato({ ...contrato, second_payment_date: secondPaymentDate });
    setBaseAmount(contrato.total_amount || 0);
    setDiscountPercentage(0);
    setDepositPercentage(Math.round(((contrato.deposit_amount || 0) / (contrato.total_amount || 1)) * 100));
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!currentContrato.client_name || !currentContrato.client_address || !currentContrato.wedding_date) {
      toast.warning('Por favor completa los campos obligatorios (Nombre, Dirección y Fecha)');
      return;
    }

    setLoading(true);
    try {
      // Guardar venue para futuros usos
      if (currentContrato.venue && currentContrato.venue_address) {
        saveVenue(currentContrato.venue, currentContrato.venue_address);
      }
      
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
          package_type: 'Colección Uno',
          total_amount: 59000,
          deposit_amount: 29500,
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
        deliverables: contrato.deliverables || [],
        total_amount: contrato.total_amount,
        deposit_amount: contrato.deposit_amount,
        second_payment_date: contrato.second_payment_date || '',
        meals_count: contrato.meals_count || 0,
        contract_date: contrato.contract_date,
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
            <h1 className="text-3xl font-bold text-gray-800">Generador de Contratos</h1>
            <p className="text-gray-600 mt-2">Crea y genera contratos profesionales para tus clientes</p>
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
                <th className="text-left p-4">Fecha Boda</th>
                <th className="text-left p-4">Paquete</th>
                <th className="text-left p-4">Monto Total</th>
                <th className="text-left p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredContratos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
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
                        <div className="text-xs text-gray-500">{contrato.client_address}</div>
                      </div>
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleGeneratePDF(contrato)}
                          className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition"
                          title="Generar PDF"
                        >
                          📄 PDF
                        </button>
                        {contrato.signed_contract_file && (
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = contrato.signed_contract_file!;
                              link.download = `Contrato_Firmado_${contrato.client_name}.pdf`;
                              link.click();
                            }}
                            className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition"
                            title="Descargar contrato firmado"
                          >
                            ✓ Firmado
                          </button>
                        )}
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

        {/* Simple Stats */}
        {contratos.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-2 text-gray-800">
              {isEditing ? 'Editar Contrato' : 'Generar Nuevo Contrato'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Completa los datos para generar el contrato profesional en PDF
            </p>

            <div className="space-y-4">
              {/* Client Info */}
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
                  Dirección del Cliente *
                </label>
                <input
                  type="text"
                  value={currentContrato.client_address || ''}
                  onChange={(e) =>
                    setCurrentContrato({ ...currentContrato, client_address: e.target.value })
                  }
                  placeholder="Calle, Colonia, Ciudad, Estado"
                  className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (opcional)
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono (opcional)
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Boda *
                  </label>
                  <input
                    type="date"
                    value={currentContrato.wedding_date || ''}
                    onChange={(e) => {
                      const weddingDate = e.target.value;
                      let secondPaymentDate = '';
                      
                      // Calcular segundo pago 15 días antes del evento
                      if (weddingDate) {
                        const eventDate = new Date(weddingDate + 'T00:00:00');
                        eventDate.setDate(eventDate.getDate() - 15);
                        secondPaymentDate = eventDate.toISOString().split('T')[0];
                      }
                      
                      setCurrentContrato({ 
                        ...currentContrato, 
                        wedding_date: weddingDate,
                        second_payment_date: secondPaymentDate
                      });
                    }}
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lugar del Evento
                  </label>
                  <input
                    type="text"
                    value={currentContrato.venue || ''}
                    onChange={(e) => {
                      setCurrentContrato({ ...currentContrato, venue: e.target.value });
                      setShowVenueSuggestions(true);
                    }}
                    onFocus={() => setShowVenueSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowVenueSuggestions(false), 200)}
                    placeholder="Nombre del lugar"
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                  {showVenueSuggestions && savedVenues.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-stone-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {savedVenues
                        .filter(v => !currentContrato.venue || v.name.toLowerCase().includes(currentContrato.venue.toLowerCase()))
                        .map((venue, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setCurrentContrato({ 
                                ...currentContrato, 
                                venue: venue.name,
                                venue_address: venue.address
                              });
                              setShowVenueSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-stone-100 transition"
                          >
                            <div className="font-medium text-gray-800">{venue.name}</div>
                            <div className="text-xs text-gray-500">{venue.address}</div>
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección del Lugar
                  </label>
                  <input
                    type="text"
                    value={currentContrato.venue_address || ''}
                    onChange={(e) =>
                      setCurrentContrato({ ...currentContrato, venue_address: e.target.value })
                    }
                    placeholder="Dirección completa del evento"
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                </div>
              </div>

              {/* Package Info */}
              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paquete
                  </label>
                  <select
                    value={currentContrato.package_type || 'Colección Uno'}
                    onChange={(e) => {
                      const packageType = e.target.value;
                      let updates: Partial<Contrato> = { package_type: packageType };
                      let base = 0;
                      
                      // Auto-ajustar valores según paquete seleccionado
                      switch(packageType) {
                        case 'Colección Uno':
                          base = 59000;
                          updates = { ...updates, coverage_hours: 8, photographers_count: 1, videographers_count: 1, meals_count: 3, deliverables: ['8 horas de cobertura', '1 fotógrafo', '400-500 fotografías', 'Galería digital', '1 videógrafo', 'Video de 20-25 minutos', 'Versión 1 minuto'] };
                          break;
                        case 'Colección Dos':
                          base = 72000;
                          updates = { ...updates, coverage_hours: 10, photographers_count: 1, videographers_count: 1, meals_count: 3, deliverables: ['10 horas de cobertura', '1 fotógrafo', '600-700 fotografías', 'Galería digital', '1 videógrafo', 'Video de 30-35 minutos', 'Versión 3-5 minutos', 'Versión 1 minuto', 'Photobook 8.5x11" (50 páginas)', 'Sesión pre boda'] };
                          break;
                        case 'Colección Tres':
                          base = 95000;
                          updates = { ...updates, coverage_hours: 10, photographers_count: 2, videographers_count: 2, meals_count: 5, deliverables: ['10 horas de cobertura', '2 fotógrafos', '800-900 fotografías', 'Galería digital', '2 videógrafos', 'Video de 40-45 minutos', 'Versión 3-5 minutos', 'Versión 1 minuto', 'Drón para tomas aéreas', 'Photobook 11x11" (50 páginas)', 'Sesión pre boda'] };
                          break;
                        case 'Colección Diamante':
                          base = 110000;
                          updates = { ...updates, coverage_hours: 12, photographers_count: 2, videographers_count: 2, meals_count: 6, deliverables: ['12 horas de cobertura', '2 fotógrafos', '1000+ fotografías', 'Galería digital', '2 videógrafos', 'Video de 50-55 minutos', 'Versión 3-5 minutos', 'Versión 1 minuto', 'Creador de contenido', 'Drón para tomas aéreas', 'Photobook 12x12" (50 páginas)', 'Invitación digital', 'Sesión pre boda', 'Sesión post boda'] };
                          break;
                      }
                      
                      setBaseAmount(base);
                      const total = Math.round(base * (1 - discountPercentage / 100));
                      const deposit = Math.round((total * depositPercentage) / 100);
                      updates = { ...updates, total_amount: total, deposit_amount: deposit };
                      setCurrentContrato({ ...currentContrato, ...updates });
                    }}
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  >
                    <option value="Colección Uno">Colección Uno - $59,000</option>
                    <option value="Colección Dos">Colección Dos - $72,000</option>
                    <option value="Colección Tres">Colección Tres - $95,000</option>
                    <option value="Colección Diamante">Colección Diamante - $110,000</option>
                  </select>
                </div>
              </div>

              {/* Financial Info */}
              <div className="border-t border-stone-200 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Características del Servicio (editable para personalización)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horas de Cobertura
                    </label>
                    <input
                      type="number"
                      value={currentContrato.coverage_hours || 8}
                      onChange={(e) =>
                        setCurrentContrato({
                          ...currentContrato,
                          coverage_hours: parseInt(e.target.value) || 8,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fotógrafos
                    </label>
                    <input
                      type="number"
                      value={currentContrato.photographers_count || 1}
                      onChange={(e) =>
                        setCurrentContrato({
                          ...currentContrato,
                          photographers_count: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Videógrafos
                    </label>
                    <input
                      type="number"
                      value={currentContrato.videographers_count || 1}
                      onChange={(e) =>
                        setCurrentContrato({
                          ...currentContrato,
                          videographers_count: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entregables (uno por línea)
                  </label>
                  <textarea
                    value={Array.isArray(currentContrato.deliverables) ? currentContrato.deliverables.join('\n') : ''}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').filter(line => line.trim());
                      setCurrentContrato({
                        ...currentContrato,
                        deliverables: lines,
                      });
                    }}
                    rows={4}
                    placeholder="Álbum digital&#10;Video highlights&#10;USB con fotos"
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Alimentos
                  </label>
                  <input
                    type="number"
                    value={currentContrato.meals_count || 0}
                    onChange={(e) =>
                      setCurrentContrato({
                        ...currentContrato,
                        meals_count: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Cantidad de alimentos para el equipo"
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                </div>
              </div>

              {/* Financial Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Total
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                        <input
                          type="number"
                          value={baseAmount}
                          onChange={(e) => {
                            const base = parseFloat(e.target.value) || 0;
                            setBaseAmount(base);
                            const total = Math.round(base * (1 - discountPercentage / 100));
                            const deposit = Math.round((total * depositPercentage) / 100);
                            setCurrentContrato({
                              ...currentContrato,
                              total_amount: total,
                              deposit_amount: deposit,
                            });
                          }}
                          placeholder="Precio base"
                          className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700 pl-8"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="relative">
                        <input
                          type="number"
                          value={discountPercentage}
                          onChange={(e) => {
                            const discount = parseFloat(e.target.value) || 0;
                            setDiscountPercentage(discount);
                            const total = Math.round(baseAmount * (1 - discount / 100));
                            const deposit = Math.round((total * depositPercentage) / 100);
                            setCurrentContrato({
                              ...currentContrato,
                              total_amount: total,
                              deposit_amount: deposit,
                            });
                          }}
                          min="0"
                          max="100"
                          placeholder="Descuento"
                          className="w-full px-3 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700 pr-8"
                        />
                        <span className="absolute right-3 top-3 text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                  {discountPercentage > 0 && (
                    <div className="text-sm font-semibold text-green-600 mt-2 text-right">
                      Total con descuento: ${currentContrato.total_amount?.toLocaleString('es-MX')}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anticipo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="relative">
                        <input
                          type="number"
                          value={depositPercentage}
                          onChange={(e) => {
                            const percentage = parseFloat(e.target.value) || 0;
                            setDepositPercentage(percentage);
                            const deposit = Math.round(((currentContrato.total_amount || 0) * percentage) / 100);
                            setCurrentContrato({
                              ...currentContrato,
                              deposit_amount: deposit,
                            });
                          }}
                          min="0"
                          max="100"
                          className="w-full px-3 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700 pr-8"
                        />
                        <span className="absolute right-3 top-3 text-gray-500">%</span>
                      </div>
                    </div>
                    <div>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                        <input
                          type="number"
                          value={currentContrato.deposit_amount || 0}
                          onChange={(e) => {
                            const deposit = parseFloat(e.target.value) || 0;
                            const total = currentContrato.total_amount || 0;
                            const percentage = total > 0 
                              ? Math.round((deposit / total) * 100) 
                              : 20;
                            setDepositPercentage(percentage);
                            setCurrentContrato({
                              ...currentContrato,
                              deposit_amount: deposit,
                            });
                          }}
                          className="w-full px-3 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700 pl-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Payment Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Segundo Pago
                  </label>
                  <input
                    type="date"
                    value={currentContrato.second_payment_date || ''}
                    onChange={(e) =>
                      setCurrentContrato({ ...currentContrato, second_payment_date: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                  {currentContrato.wedding_date && currentContrato.second_payment_date && (
                    <div className="text-xs text-gray-500 mt-1">
                      {(() => {
                        const weddingDate = new Date(currentContrato.wedding_date + 'T00:00:00');
                        const paymentDate = new Date(currentContrato.second_payment_date + 'T00:00:00');
                        const diffDays = Math.round((weddingDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
                        return `${diffDays} días antes del evento`;
                      })()}
                    </div>
                  )}
                </div>
                <div></div>
              </div>

              {/* Upload Signed Contract */}
              <div className="border-t border-stone-200 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Contrato Firmado
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargar Contrato Firmado (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error('El archivo es muy grande. Máximo 10MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          setCurrentContrato({
                            ...currentContrato,
                            signed_contract_file: reader.result as string,
                          });
                          toast.success('Contrato firmado cargado correctamente');
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                  {currentContrato.signed_contract_file && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-green-600">✓ Contrato firmado cargado</span>
                      <button
                        type="button"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = currentContrato.signed_contract_file!;
                          link.download = `Contrato_Firmado_${currentContrato.client_name}.pdf`;
                          link.click();
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        Descargar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentContrato({
                            ...currentContrato,
                            signed_contract_file: undefined,
                          });
                        }}
                        className="text-xs text-red-600 hover:text-red-700 underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
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
