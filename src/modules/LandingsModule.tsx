import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { API } from '../config';

interface Landing {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  hero_image: string;
  adjustment_type: 'none' | 'percentage' | 'fixed';
  adjustment_value: number;
  show_badge: boolean;
  badge_text: string;
  landing_type: 'client' | 'planner';
  created_at: string;
  updated_at: string;
}

export default function LandingsModule() {
  const toast = useToast();
  const [landings, setLandings] = useState<Landing[]>([]);
  const [filteredLandings, setFilteredLandings] = useState<Landing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentLanding, setCurrentLanding] = useState<Partial<Landing>>({
    landing_type: 'client',
    adjustment_type: 'none',
    adjustment_value: 0,
    show_badge: false,
    badge_text: '',
  });

  // Imágenes disponibles para hero
  const availableImages = [
    '/images/gallery/TOP-PyP-505.webp',
    '/images/gallery/SandJ-404.webp',
    '/images/gallery/TOP-SyP-324-hero.webp',
    '/images/gallery/TOP-AyJ-500.webp',
    '/images/gallery/TOP-CyD-67.webp',
    '/images/gallery/TOP-KyB-236.webp',
    '/images/gallery/TOP-PyC-312.webp',
    '/images/gallery/TOP-SyD-162.webp',
    '/images/gallery/TOP-SyP-116.webp',
    '/images/gallery/KandE-474.webp',
    '/images/gallery/PyP-432.webp',
    '/images/gallery/SYO-832.webp',
    '/images/gallery/AyJ-493.webp',
    '/images/gallery/CyD-80.webp',
    '/images/gallery/KyB-607.webp',
    '/images/RLJ/L&A-363_websize.jpg',
  ];

  useEffect(() => {
    fetchLandings();
  }, []);

  useEffect(() => {
    const filtered = landings.filter(
      (l) =>
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLandings(filtered);
  }, [searchTerm, landings]);

  const fetchLandings = async () => {
    try {
      const response = await fetch(API.landings);
      const data = await response.json();
      setLandings(data);
    } catch (error) {
      console.error('Error fetching landings:', error);
      alert('Error al cargar landings');
    }
  };

  const handleCreate = () => {
    setIsEditing(false);
    setCurrentLanding({
      landing_type: 'client',
      adjustment_type: 'none',
      adjustment_value: 0,
      show_badge: false,
      badge_text: '',
    });
    setShowImagePicker(false);
    setIsModalOpen(true);
  };

  const handleEdit = (landing: Landing) => {
    setIsEditing(true);
    setCurrentLanding(landing);
    setShowImagePicker(false);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!currentLanding.title || !currentLanding.subtitle || !currentLanding.slug || !currentLanding.hero_image) {
      toast.warning('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const url = isEditing
        ? `/api/landings/${currentLanding.id}`
        : '/api/landings';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentLanding),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar');
      }

      await fetchLandings();
      setIsModalOpen(false);
      toast.success(isEditing ? 'Landing actualizada exitosamente' : 'Landing creada exitosamente');
    } catch (error) {
      console.error('Error saving landing:', error);
      toast.error((error as Error).message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/landings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      await fetchLandings();
      toast.success('Landing eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting landing:', error);
      toast.error('Error al eliminar landing');
    }
  };

  const handleGenerate = async (landing: Landing) => {
    try {
      const response = await fetch(`/api/landings/${landing.id}/generate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al generar archivos');
      }

      const result = await response.json();
      toast.success(`✅ ${result.message}`);
    } catch (error) {
      console.error('Error generating files:', error);
      toast.error((error as Error).message);
    }
  };

  const handlePreview = async () => {
    if (!currentLanding.title || !currentLanding.subtitle || !currentLanding.slug || !currentLanding.hero_image) {
      toast.warning('Por favor completa todos los campos requeridos antes de ver el preview');
      return;
    }

    try {
      const response = await fetch(API.landingsPreview, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentLanding),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al generar preview');
      }

      const result = await response.json();
      
      // Abrir preview en nueva pestaña
      window.open(`http://localhost:3000${result.previewUrl}`, '_blank');
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error((error as Error).message);
    }
  };

  const autoGenerateSlug = (title: string) => {
    return 'colecciones-' + title
      .toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSeedLandings = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch(API.landingsSeed, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Error al importar landings');

      const result = await response.json();
      toast.success(`✅ ${result.message}`);
      await fetchLandings();
    } catch (error) {
      console.error('Error seeding landings:', error);
      toast.error('Error al importar landings');
    } finally {
      setIsSeeding(false);
    }
  };

  const stats = {
    total: landings.length,
    clients: landings.filter((l) => l.landing_type === 'client').length,
    planners: landings.filter((l) => l.landing_type === 'planner').length,
  };

  // Precios base de las colecciones
  const basePrices = [
    { name: 'Colección Uno', price: 25000 },
    { name: 'Colección Dos', price: 72000 },
    { name: 'Colección Tres', price: 95000 },
    { name: 'Colección Diamante', price: 110000 },
  ];

  // Calcular precios ajustados
  const calculateAdjustedPrice = (basePrice: number) => {
    if (!currentLanding.adjustment_type || currentLanding.adjustment_type === 'none') {
      return basePrice;
    }
    
    if (currentLanding.adjustment_type === 'percentage') {
      return Math.round(basePrice * (1 + (currentLanding.adjustment_value || 0) / 100));
    }
    
    if (currentLanding.adjustment_type === 'fixed') {
      return basePrice + (currentLanding.adjustment_value || 0);
    }
    
    return basePrice;
  };

  const hasAdjustment = currentLanding.adjustment_type && currentLanding.adjustment_type !== 'none' && currentLanding.adjustment_value !== 0;

  return (
    <div className="min-h-screen bg-stone-50">
      <toast.ToastContainer />
      <div className="main-container py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#2B2B2B] mb-2">Landings de Colecciones</h1>
          <p className="text-[#2B2B2B]/60">Gestiona las páginas de aterrizaje para clientes y planners</p>
        </div>
        <div className="flex gap-3">
          {landings.length === 0 && (
            <button
              onClick={handleSeedLandings}
              disabled={isSeeding}
              className="px-6 py-3 bg-[#8B5A6F] text-white rounded hover:bg-[#8B5A6F]/90 transition-colors font-medium disabled:opacity-50"
            >
              {isSeeding ? 'Importando...' : '📥 Importar Existentes'}
            </button>
          )}
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-[#C67B5C] text-white rounded hover:bg-[#C67B5C]/90 transition-colors font-medium"
          >
            + Nueva Landing
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-[#E8E3DD] p-6 rounded-lg">
          <p className="text-[#2B2B2B]/60 text-sm mb-1">Total Landings</p>
          <p className="text-3xl font-bold text-[#2B2B2B]">{stats.total}</p>
        </div>
        <div className="bg-white border border-[#E8E3DD] p-6 rounded-lg">
          <p className="text-[#2B2B2B]/60 text-sm mb-1">Clientes</p>
          <p className="text-3xl font-bold text-[#C67B5C]">{stats.clients}</p>
        </div>
        <div className="bg-white border border-[#E8E3DD] p-6 rounded-lg">
          <p className="text-[#2B2B2B]/60 text-sm mb-1">Planners</p>
          <p className="text-3xl font-bold text-[#8B5A6F]">{stats.planners}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por título, subtítulo o slug..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-white text-[#2B2B2B] rounded border border-[#E8E3DD] focus:border-[#C67B5C] focus:outline-none"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLandings.map((landing) => (
          <div key={landing.id} className="bg-white rounded-lg overflow-hidden border border-[#E8E3DD] hover:border-[#C67B5C] transition-colors shadow-sm">
            {/* Image */}
            <div className="h-40 bg-[#FAF8F5] overflow-hidden">
              <img
                src={landing.hero_image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23E8E3DD" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%232B2B2B" font-size="12"%3ESin imagen%3C/svg%3E'}
                alt={landing.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23E8E3DD" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%232B2B2B" font-size="12"%3ESin imagen%3C/svg%3E';
                }}
              />
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-[#2B2B2B]">{landing.title}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    landing.landing_type === 'client' ? 'bg-[#C67B5C] text-white' : 'bg-[#8B5A6F] text-white'
                  }`}
                >
                  {landing.landing_type === 'client' ? 'Cliente' : 'Planner'}
                </span>
              </div>
              <p className="text-sm text-[#2B2B2B]/60 mb-3">{landing.subtitle}</p>
              <p className="text-xs text-[#2B2B2B]/40 mb-3 font-mono">/{landing.slug}</p>

              {/* Adjustment Badge */}
              {landing.adjustment_type !== 'none' && (
                <div className="mb-3">
                  <span className="px-2 py-1 bg-[#E8C4B8] text-[#2B2B2B] text-xs rounded">
                    {landing.adjustment_type === 'percentage'
                      ? `${landing.adjustment_value > 0 ? '+' : ''}${landing.adjustment_value}%`
                      : `${landing.adjustment_value > 0 ? '+' : ''}$${Math.abs(landing.adjustment_value).toLocaleString('es-MX')}`}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const url = `http://localhost:3000/${landing.slug}`;
                      window.open(url, '_blank');
                    }}
                    className="px-3 py-2 bg-[#8B5A6F] text-white rounded hover:bg-[#8B5A6F]/90 transition-colors text-sm text-center flex items-center justify-center gap-1"
                  >
                    <span>👁️</span>
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => handleGenerate(landing)}
                    className="px-3 py-2 bg-[#C67B5C] text-white rounded hover:bg-[#C67B5C]/90 transition-colors text-sm"
                  >
                    Generar
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleEdit(landing)}
                    className="px-3 py-2 bg-[#2B2B2B] text-white rounded hover:bg-[#2B2B2B]/90 transition-colors text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(landing.id)}
                    className="px-3 py-2 bg-[#2B2B2B]/60 text-white rounded hover:bg-[#2B2B2B]/80 transition-colors text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLandings.length === 0 && (
        <div className="text-center py-12 text-[#2B2B2B]/60">
          {searchTerm ? 'No se encontraron landings' : 'Aún no hay landings. Crea una nueva!'}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-[#E8E3DD]">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#2B2B2B] mb-6">
                {isEditing ? 'Editar Landing' : 'Nueva Landing'}
              </h2>

              {/* Type Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#2B2B2B] mb-2">Tipo de Landing</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentLanding({ ...currentLanding, landing_type: 'client' })}
                    className={`p-4 rounded border-2 transition-colors ${
                      currentLanding.landing_type === 'client'
                        ? 'border-[#C67B5C] bg-[#C67B5C] text-white'
                        : 'border-[#E8E3DD] bg-white text-[#2B2B2B]/60 hover:border-[#C67B5C]/50'
                    }`}
                  >
                    <div className="text-lg font-semibold mb-1">Cliente</div>
                    <div className="text-sm">Landing general para clientes</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentLanding({ ...currentLanding, landing_type: 'planner' })}
                    className={`p-4 rounded border-2 transition-colors ${
                      currentLanding.landing_type === 'planner'
                        ? 'border-[#8B5A6F] bg-[#8B5A6F] text-white'
                        : 'border-[#E8E3DD] bg-white text-[#2B2B2B]/60 hover:border-[#8B5A6F]/50'
                    }`}
                  >
                    <div className="text-lg font-semibold mb-1">Planner</div>
                    <div className="text-sm">Con ajustes de precio personalizados</div>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#2B2B2B] mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={currentLanding.title || ''}
                  onChange={(e) => {
                    const title = e.target.value;
                    setCurrentLanding({ 
                      ...currentLanding, 
                      title,
                      slug: currentLanding.slug || autoGenerateSlug(title)
                    });
                  }}
                  className="w-full px-4 py-2 bg-white text-[#2B2B2B] rounded border border-[#E8E3DD] focus:border-[#C67B5C] focus:outline-none"
                  placeholder="ej: Colecciones Karen & Roberto"
                />
              </div>

              {/* Subtitle */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#2B2B2B] mb-2">
                  Subtítulo / Venue *
                </label>
                <input
                  type="text"
                  value={currentLanding.subtitle || ''}
                  onChange={(e) => setCurrentLanding({ ...currentLanding, subtitle: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-[#2B2B2B] rounded border border-[#E8E3DD] focus:border-[#C67B5C] focus:outline-none"
                  placeholder="ej: Hacienda San Antonio Hool"
                />
              </div>

              {/* Slug */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#2B2B2B] mb-2">
                  Slug (URL) *
                </label>
                <input
                  type="text"
                  value={currentLanding.slug || ''}
                  onChange={(e) => setCurrentLanding({ ...currentLanding, slug: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-[#2B2B2B] rounded border border-[#E8E3DD] focus:border-[#C67B5C] focus:outline-none font-mono"
                  placeholder="colecciones-nombre"
                />
                <p className="text-xs text-[#2B2B2B]/60 mt-1">Se generará automáticamente del título si lo dejas vacío</p>
              </div>

              {/* Hero Image */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#2B2B2B] mb-2">
                  Imagen Hero *
                </label>
                {currentLanding.hero_image && (
                  <div className="mb-3 w-full h-32 rounded border border-[#E8E3DD] overflow-hidden">
                    <img 
                      src={`http://localhost:3000${currentLanding.hero_image}`}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23E8E3DD" width="100" height="100"/%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowImagePicker(!showImagePicker)}
                  className="w-full px-4 py-2 bg-white text-[#2B2B2B] rounded border border-[#E8E3DD] hover:border-[#C67B5C] transition-colors flex items-center justify-center gap-2"
                >
                  <span>🖼️</span>
                  <span>{currentLanding.hero_image ? 'Cambiar imagen' : 'Seleccionar imagen'}</span>
                </button>
                {showImagePicker && (
                  <div className="mt-3 p-3 bg-[#FAF8F5] border border-[#E8E3DD] rounded max-h-80 overflow-y-auto">
                    <div className="grid grid-cols-4 gap-2">
                      {availableImages.map((img) => (
                        <button
                          key={img}
                          type="button"
                          onClick={() => {
                            setCurrentLanding({ ...currentLanding, hero_image: img });
                            setShowImagePicker(false);
                          }}
                          className={`relative aspect-video rounded overflow-hidden border-2 transition-all hover:scale-105 ${
                            currentLanding.hero_image === img 
                              ? 'border-[#C67B5C] ring-2 ring-[#C67B5C]/30' 
                              : 'border-[#E8E3DD] hover:border-[#C67B5C]/50'
                          }`}
                        >
                          <img
                            src={`http://localhost:3000${img}`}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23E8E3DD" width="100" height="100"/%3E%3C/svg%3E';
                            }}
                          />
                          {currentLanding.hero_image === img && (
                            <div className="absolute inset-0 bg-[#C67B5C]/20 flex items-center justify-center">
                              <span className="text-2xl text-white">✓</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Adjustment Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#2B2B2B] mb-2">
                  Ajuste de Precio
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="adjustment_type"
                      checked={currentLanding.adjustment_type === 'none'}
                      onChange={() => setCurrentLanding({ ...currentLanding, adjustment_type: 'none', adjustment_value: 0 })}
                      className="mr-2"
                    />
                    <span className="text-[#2B2B2B]">Sin ajuste (precios base)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="adjustment_type"
                      checked={currentLanding.adjustment_type === 'percentage'}
                      onChange={() => setCurrentLanding({ ...currentLanding, adjustment_type: 'percentage', adjustment_value: 0 })}
                      className="mr-2"
                    />
                    <span className="text-[#2B2B2B]">Porcentaje (%)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="adjustment_type"
                      checked={currentLanding.adjustment_type === 'fixed'}
                      onChange={() => setCurrentLanding({ ...currentLanding, adjustment_type: 'fixed', adjustment_value: 0 })}
                      className="mr-2"
                    />
                    <span className="text-[#2B2B2B]">Cantidad fija (MXN)</span>
                  </label>
                </div>
              </div>

              {/* Adjustment Value */}
              {currentLanding.adjustment_type !== 'none' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#2B2B2B] mb-2">
                    Valor del Ajuste
                  </label>
                  <input
                    type="number"
                    value={currentLanding.adjustment_value || 0}
                    onChange={(e) => setCurrentLanding({ ...currentLanding, adjustment_value: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-white text-[#2B2B2B] rounded border border-[#E8E3DD] focus:border-[#C67B5C] focus:outline-none"
                    placeholder={currentLanding.adjustment_type === 'percentage' ? 'ej: -40 o +20' : 'ej: -10000 o +30000'}
                  />
                  <p className="text-xs text-[#2B2B2B]/60 mt-1">
                    {currentLanding.adjustment_type === 'percentage' 
                      ? 'Usa números negativos para descuentos (-40 = 40% descuento)'
                      : 'Usa números negativos para descuentos, positivos para incrementos'}
                  </p>
                </div>
              )}

              {/* Badge */}
              <div className="mb-4">
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={currentLanding.show_badge || false}
                    onChange={(e) => setCurrentLanding({ ...currentLanding, show_badge: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-[#2B2B2B]">Mostrar badge personalizado</span>
                </label>
                {currentLanding.show_badge && (
                  <input
                    type="text"
                    value={currentLanding.badge_text || ''}
                    onChange={(e) => setCurrentLanding({ ...currentLanding, badge_text: e.target.value })}
                    className="w-full px-4 py-2 bg-white text-[#2B2B2B] rounded border border-[#E8E3DD] focus:border-[#C67B5C] focus:outline-none"
                    placeholder="ej: Paquete especial incluido"
                  />
                )}
              </div>

              {/* Preview de Precios */}
              {hasAdjustment && (
                <div className="mb-6 p-4 bg-[#FAF8F5] border border-[#E8E3DD] rounded">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#2B2B2B]">Preview de Precios</h3>
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-xs px-3 py-1 bg-[#8B5A6F] text-white rounded hover:bg-[#8B5A6F]/90 transition-colors"
                    >
                      {showPreview ? 'Ocultar Preview Completo' : 'Ver Preview Completo'}
                    </button>
                  </div>
                  
                  {!showPreview ? (
                    <>
                      <div className="space-y-2">
                        {basePrices.map((item) => {
                          const adjustedPrice = calculateAdjustedPrice(item.price);
                          const hasDiscount = adjustedPrice < item.price;
                          
                          return (
                            <div key={item.name} className="flex justify-between items-center text-sm">
                              <span className="text-[#2B2B2B]/80">{item.name}</span>
                              <div className="flex items-center gap-2">
                                {hasDiscount && (
                                  <span className="text-[#2B2B2B]/40 line-through">
                                    ${item.price.toLocaleString('es-MX')}
                                  </span>
                                )}
                                <span className={`font-semibold ${hasDiscount ? 'text-[#C67B5C]' : 'text-[#2B2B2B]'}`}>
                                  ${adjustedPrice.toLocaleString('es-MX')}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {currentLanding.adjustment_type === 'percentage' && currentLanding.adjustment_value && currentLanding.adjustment_value < 0 && (
                        <p className="text-xs text-[#C67B5C] mt-3 font-semibold">
                          ¡{Math.abs(currentLanding.adjustment_value)}% de descuento aplicado!
                        </p>
                      )}
                      {currentLanding.adjustment_type === 'percentage' && currentLanding.adjustment_value && currentLanding.adjustment_value > 0 && (
                        <p className="text-xs text-[#2B2B2B]/60 mt-3">
                          +{currentLanding.adjustment_value}% incremento aplicado
                        </p>
                      )}
                      {currentLanding.adjustment_type === 'fixed' && currentLanding.adjustment_value && currentLanding.adjustment_value !== 0 && (
                        <p className="text-xs text-[#2B2B2B]/60 mt-3">
                          {currentLanding.adjustment_value > 0 ? '+' : ''}${Math.abs(currentLanding.adjustment_value).toLocaleString('es-MX')} MXN {currentLanding.adjustment_value > 0 ? 'agregado' : 'descontado'}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {basePrices.map((item) => {
                        const adjustedPrice = calculateAdjustedPrice(item.price);
                        const hasDiscount = adjustedPrice < item.price;
                        
                        return (
                          <div key={item.name} className="bg-white border border-[#E8E3DD] p-4 rounded">
                            <h4 className="font-semibold text-[#2B2B2B] mb-2">{item.name}</h4>
                            <div className="text-center pt-3 border-t border-[#E8E3DD]">
                              {hasDiscount ? (
                                <>
                                  <p className="text-lg text-[#2B2B2B]/40 line-through mb-1">
                                    ${item.price.toLocaleString('es-MX')}
                                  </p>
                                  <p className="text-2xl font-light text-[#2B2B2B]">
                                    ${adjustedPrice.toLocaleString('es-MX')} <span className="text-sm text-[#2B2B2B]/50 uppercase tracking-wider">MXN</span>
                                  </p>
                                </>
                              ) : (
                                <p className="text-2xl font-light text-[#2B2B2B]">
                                  ${adjustedPrice.toLocaleString('es-MX')} <span className="text-sm text-[#2B2B2B]/50 uppercase tracking-wider">MXN</span>
                                </p>
                              )}
                              {currentLanding.show_badge && currentLanding.badge_text && (
                                <p className="text-sm text-[#2B2B2B]/70 font-semibold mt-2">
                                  {currentLanding.badge_text}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  className="flex-1 px-6 py-3 bg-[#C67B5C] text-white rounded hover:bg-[#C67B5C]/90 transition-colors font-medium"
                >
                  {isEditing ? 'Guardar Cambios' : 'Crear Landing'}
                </button>
                <button
                  onClick={handlePreview}
                  className="px-6 py-3 bg-[#8B5A6F] text-white rounded hover:bg-[#8B5A6F]/90 transition-colors"
                >
                  Preview
                </button>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setShowImagePicker(false);
                    setShowPreview(false);
                  }}
                  className="px-6 py-3 bg-[#2B2B2B]/80 text-white rounded hover:bg-[#2B2B2B] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
