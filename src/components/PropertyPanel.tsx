import React, { useState } from 'react';
import { ContentSection, MenuItem, ScreenConfig } from '../types';
import { Trees, Image } from 'lucide-react';
import MenuEditor from './MenuEditor';
import BannerEditor from './BannerEditor';

interface PropertyPanelProps {
  widget: ContentSection | null;
  onUpdateWidget: (instanceId: string, updates: Partial<ContentSection>) => void;
  screen?: ScreenConfig; // Current screen data to access menu items
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ widget, onUpdateWidget, screen }) => {
  const [showMenuEditor, setShowMenuEditor] = useState(false);
  const [showBannerEditor, setShowBannerEditor] = useState(false);

  if (!widget) {
    return (
      <div className="h-full bg-white border-l border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">📱</div>
          <h3 className="text-lg font-semibold mb-2">Tidak Ada Widget Dipilih</h3>
          <p className="text-sm">Pilih widget untuk mengedit propertinya</p>
        </div>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<ContentSection>) => {
    onUpdateWidget(widget.instanceId, updates);
  };

  // Get all menu items from the current screen for cloning
  const getAllMenuItems = (): MenuItem[] => {
    if (!screen?.content) return [];
    
    const menuItems: MenuItem[] = [];
    
    const extractMenuItems = (items: MenuItem[]) => {
      items.forEach(item => {
        menuItems.push(item);
        if (item.submenu?.items) {
          extractMenuItems(item.submenu.items);
        }
      });
    };
    
    screen.content.forEach(widget => {
      if (widget.items) {
        extractMenuItems(widget.items);
      }
    });
    
    return menuItems;
  };

  const renderGeneralProperties = () => (
    <>
      <div className="property-section">
        <h3 className="text-lg font-semibold mb-3">Properti Umum</h3>
        
        <div className="form-group">
          <label className="form-label">Jenis Widget</label>
          <input
            type="text"
            className="form-input bg-gray-100"
            value={widget.id}
            disabled
          />
        </div>

        <div className="form-group">
          <label className="form-label">ID Instansi</label>
          <input
            type="text"
            className="form-input bg-gray-100"
            value={widget.instanceId}
            disabled
          />
        </div>
      </div>
    </>
  );

  const renderMenuGroupProperties = () => (
    <div className="property-section">
      <h3 className="text-lg font-semibold mb-3">Properti Grup Menu</h3>
      
      {/* Frame Configuration */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-md font-medium text-gray-700">Konfigurasi Frame</h4>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={!!widget.frame}
              onChange={(e) => {
                if (e.target.checked) {
                  handleUpdate({
                    frame: {
                      width: 60,
                      height: 60,
                      borderRadius: 20,
                      borderLine: true,
                      shadow: true,
                      padding: {
                        top: 8,
                        bottom: 8,
                        left: 8,
                        right: 8
                      }
                    }
                  });
                } else {
                  handleUpdate({ frame: undefined });
                }
              }}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        {widget.frame && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label text-sm">Lebar (px)</label>
                <input
                  type="number"
                  className="form-input text-sm py-2"
                  value={widget.frame?.width?.toString() || '60'}
                  onChange={(e) => handleUpdate({
                    frame: {
                      ...widget.frame!,
                      width: parseFloat(e.target.value)
                    }
                  })}
                  min="20"
                  max="200"
                  step="0.1"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label text-sm">Tinggi (px)</label>
                <input
                  type="number"
                  className="form-input text-sm py-2"
                  value={widget.frame?.height?.toString() || '60'}
                  onChange={(e) => handleUpdate({
                    frame: {
                      ...widget.frame!,
                      height: parseFloat(e.target.value)
                    }
                  })}
                  min="20"
                  max="200"
                  step="0.1"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label text-sm">Radius Border (px)</label>
              <input
                type="number"
                className="form-input text-sm py-2"
                                  value={widget.frame?.borderRadius?.toString() || '20'}
                onChange={(e) => handleUpdate({
                  frame: {
                    ...widget.frame!,
                    borderRadius: parseFloat(e.target.value)
                  }
                })}
                min="0"
                max="50"
                step="0.1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="checkbox-label text-sm">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={widget.frame?.borderLine || false}
                    onChange={(e) => handleUpdate({
                      frame: {
                        ...widget.frame!,
                        borderLine: e.target.checked
                      }
                    })}
                  />
                  <span className="ml-2">Garis Border</span>
                </label>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label text-sm">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={widget.frame?.shadow || false}
                    onChange={(e) => handleUpdate({
                      frame: {
                        ...widget.frame!,
                        shadow: e.target.checked
                      }
                    })}
                  />
                  <span className="ml-2">Bayangan</span>
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label text-sm">Padding</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className="form-input text-sm py-2"
                  placeholder="Atas"
                  value={widget.frame?.padding?.top?.toString() || '8'}
                  onChange={(e) => handleUpdate({
                    frame: {
                      ...widget.frame!,
                      padding: {
                        ...widget.frame?.padding,
                        top: parseFloat(e.target.value)
                      }
                    }
                  })}
                  min="0"
                  max="50"
                  step="0.1"
                />
                <input
                  type="number"
                  className="form-input text-sm py-2"
                  placeholder="Bawah"
                  value={widget.frame?.padding?.bottom?.toString() || '8'}
                  onChange={(e) => handleUpdate({
                    frame: {
                      ...widget.frame!,
                      padding: {
                        ...widget.frame?.padding,
                        bottom: parseFloat(e.target.value)
                      }
                    }
                  })}
                  min="0"
                  max="50"
                  step="0.1"
                />
                <input
                  type="number"
                  className="form-input text-sm py-2"
                  placeholder="Kiri"
                  value={widget.frame?.padding?.left?.toString() || '8'}
                  onChange={(e) => handleUpdate({
                    frame: {
                      ...widget.frame!,
                      padding: {
                        ...widget.frame?.padding,
                        left: parseFloat(e.target.value)
                      }
                    }
                  })}
                  min="0"
                  max="50"
                  step="0.1"
                />
                <input
                  type="number"
                  className="form-input text-sm py-2"
                  placeholder="Kanan"
                  value={widget.frame?.padding?.right?.toString() || '8'}
                  onChange={(e) => handleUpdate({
                    frame: {
                      ...widget.frame!,
                      padding: {
                        ...widget.frame?.padding,
                        right: parseFloat(e.target.value)
                      }
                    }
                  })}
                  min="0"
                  max="50"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-2xl mb-2">🌳</div>
          <h4 className="text-base font-semibold text-gray-700 mb-1">Editor Menu Gaya Pohon</h4>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            Gunakan editor pohon tingkat lanjut untuk membuat struktur menu kompleks dengan submenu bertingkat
          </p>
          
          <button
            onClick={() => setShowMenuEditor(true)}
            className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            <Trees size={16} />
            Buka Editor Menu
          </button>
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h5 className="text-sm font-medium text-blue-800 mb-2">Struktur Menu Saat Ini</h5>
        <div className="text-xs text-blue-700 space-y-1">
          <div>• {widget.items?.length || 0} item menu utama</div>
          <div>• {widget.items?.filter(item => item.submenu).length || 0} item dengan submenu</div>
          <div>• Frame: {widget.frame ? 'Aktif' : 'Nonaktif'}</div>
          {widget.frame && (
            <div>• Ukuran frame: {widget.frame.width}×{widget.frame.height}px</div>
          )}
          <div>• Klik "Buka Editor Menu" untuk mengedit struktur lengkap</div>
        </div>
      </div>
    </div>
  );

  const renderTitleProperties = () => (
    <div className="property-section">
      <h3 className="text-lg font-semibold mb-3">Properti Judul</h3>
      
      <div className="form-group">
        <label className="form-label">Teks</label>
        <input
          type="text"
          className="form-input"
          value={widget.title?.text || ''}
          onChange={(e) => handleUpdate({
            title: {
              text: e.target.value,
              type: widget.title?.type || 'h6',
              display: widget.title?.display || 'left',
              color: widget.title?.color || '#000000',
              darkModeColor: widget.title?.darkModeColor || '#ffffff'
            }
          })}
          placeholder="Masukkan teks judul"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Jenis</label>
        <select
          className="form-select"
          value={widget.title?.type || 'h6'}
          onChange={(e) => handleUpdate({
            title: {
              text: widget.title?.text || 'Teks Judul',
              type: e.target.value as any,
              display: widget.title?.display || 'left',
              color: widget.title?.color || '#000000',
              darkModeColor: widget.title?.darkModeColor || '#ffffff'
            }
          })}
        >
          <option value="h1">H1 (Terbesar)</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
          <option value="h4">H4</option>
          <option value="h5">H5</option>
          <option value="h6">H6 (Terkecil)</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Tampilan</label>
        <select
          className="form-select"
          value={widget.title?.display || 'left'}
          onChange={(e) => handleUpdate({
            title: {
              text: widget.title?.text || 'Teks Judul',
              type: widget.title?.type || 'h6',
              display: e.target.value as any,
              color: widget.title?.color || '#000000',
              darkModeColor: widget.title?.darkModeColor || '#ffffff'
            }
          })}
        >
          <option value="left">Kiri</option>
          <option value="center">Tengah</option>
          <option value="right">Kanan</option>
          <option value="justify">Rata Kiri-Kanan</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Warna (Mode Terang)</label>
        <input
          type="color"
          className="form-input h-10"
          value={widget.title?.color || '#000000'}
          onChange={(e) => handleUpdate({
            title: {
              text: widget.title?.text || 'Teks Judul',
              type: widget.title?.type || 'h6',
              display: widget.title?.display || 'left',
              color: e.target.value,
              darkModeColor: widget.title?.darkModeColor || '#ffffff'
            }
          })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Warna (Mode Gelap)</label>
        <input
          type="color"
          className="form-input h-10"
          value={widget.title?.darkModeColor || '#ffffff'}
          onChange={(e) => handleUpdate({
            title: {
              text: widget.title?.text || 'Teks Judul',
              type: widget.title?.type || 'h6',
              display: widget.title?.display || 'left',
              color: widget.title?.color || '#000000',
              darkModeColor: e.target.value
            }
          })}
        />
      </div>
    </div>
  );

  const renderBannerSliderProperties = () => (
    <div className="property-section">
      <h3 className="text-lg font-semibold mb-3">Properti Banner Slider</h3>
      
      {/* Basic Configuration */}
      <div className="form-group mb-4">
        <label className="form-label">Varian Tata Letak</label>
        <select
          className="form-select"
          value={widget.layoutVariant || 'default'}
          onChange={(e) => handleUpdate({ layoutVariant: e.target.value as any })}
        >
          <option value="default">Default (Tampilan Halaman)</option>
          <option value="monocle">Monocle (Gulir Horizontal)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="form-group">
          <label className="form-label">Tinggi (px)</label>
          <input
            type="number"
            className="form-input"
            value={widget.height || 200}
            onChange={(e) => handleUpdate({ height: parseFloat(e.target.value) })}
            min="100"
            max="500"
            step="10"
          />
        </div>

        {widget.layoutVariant === 'monocle' && (
          <div className="form-group">
            <label className="form-label">Lebar (px)</label>
            <input
              type="number"
              className="form-input"
              value={widget.width || 150}
              onChange={(e) => handleUpdate({ width: parseFloat(e.target.value) })}
              min="100"
              max="300"
              step="10"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="form-group">
          <label className="form-label">Jarak (px)</label>
          <input
            type="number"
            className="form-input"
            value={widget.spacing?.toString() || '16'}
            onChange={(e) => handleUpdate({ spacing: parseFloat(e.target.value) })}
            min="0"
            max="50"
            step="0.1"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Radius Border (px)</label>
          <input
            type="number"
            className="form-input"
            value={widget.borderRadius?.toString() || '12'}
            onChange={(e) => handleUpdate({ borderRadius: parseFloat(e.target.value) })}
            min="0"
            max="50"
            step="0.1"
          />
        </div>
      </div>

      <div className="form-group mb-4">
        <label className="form-label">Warna Latar Belakang</label>
        <input
          type="color"
          className="form-input h-10"
          value={widget.backgroundColor || '#ffffff'}
          onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
        />
      </div>

      {/* Auto-slide Configuration - Hidden for monocle layout */}
      {widget.layoutVariant !== 'monocle' && (
        <>
          <div className="form-group mb-4">
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={widget.autoSlide || false}
                onChange={(e) => handleUpdate({ autoSlide: e.target.checked })}
              />
              <span className="ml-2">Geser Otomatis</span>
            </label>
          </div>

          {widget.autoSlide && (
            <div className="form-group mb-4">
              <label className="form-label">Interval Geser Otomatis (detik)</label>
              <input
                type="number"
                className="form-input"
                value={widget.autoSlideInterval?.toString() || '5'}
                onChange={(e) => handleUpdate({ autoSlideInterval: parseFloat(e.target.value) })}
                min="1"
                max="30"
                step="0.1"
              />
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={widget.showIndicators !== false}
              onChange={(e) => handleUpdate({ showIndicators: e.target.checked })}
            />
            <span className="ml-2">Tampilkan Indikator</span>
          </label>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={widget.showFade || false}
              onChange={(e) => handleUpdate({ showFade: e.target.checked })}
            />
            <span className="ml-2">Tampilkan Efek Fade</span>
          </label>
        </div>
      </div>

      {/* Banner Management */}
      <div className="mb-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-2xl mb-2">🖼️</div>
          <h4 className="text-base font-semibold text-gray-700 mb-1">Kelola Banner</h4>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            Tambah, edit, dan hapus banner individual dengan editor yang mudah digunakan
          </p>
          
          <button
            onClick={() => setShowBannerEditor(true)}
            className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            <Image size={16} />
            Kelola Banner
          </button>
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h5 className="text-sm font-medium text-blue-800 mb-2">Informasi Banner Saat Ini</h5>
        <div className="text-xs text-blue-700 space-y-1">
          <div>• {widget.banners?.length || 0} banner</div>
          <div>• Layout: {widget.layoutVariant || 'default'}</div>
          <div>• Tinggi: {widget.height || 200}px</div>
          {widget.layoutVariant !== 'monocle' && (
            <div>• {widget.autoSlide ? 'Auto-slide aktif' : 'Auto-slide nonaktif'}</div>
          )}
          <div>• Klik "Kelola Banner" untuk mengedit banner</div>
        </div>
      </div>
    </div>
  );


  const renderHistoryProperties = () => (
    <div className="property-section">
      <h3 className="text-lg font-semibold mb-3">Properti Riwayat</h3>
      
      <div className="form-group">
        <label className="form-label">Jumlah Transaksi</label>
        <input
          type="number"
          className="form-input"
          value={widget.count?.toString() || '3'}
          onChange={(e) => handleUpdate({ count: parseInt(e.target.value) || 3 })}
          min="1"
          max="20"
          step="1"
        />
        <div className="text-xs text-gray-500 mt-1">
          Jumlah transaksi yang akan ditampilkan (1-20)
        </div>
      </div>
      
      <div className="text-gray-600 text-sm mt-4">
        <p>Widget riwayat menampilkan transaksi terbaru secara otomatis.</p>
        <p className="mt-2">Konfigurasi jumlah transaksi mempengaruhi berapa banyak item yang ditampilkan.</p>
      </div>
    </div>
  );

  const getPropertyEditor = () => {
    switch (widget.id) {
      case 'title':
        return renderTitleProperties();
      case 'banner_slider':
        return renderBannerSliderProperties();
      case 'history':
        return renderHistoryProperties();
      default:
        if (widget.items) {
          return renderMenuGroupProperties();
        }
        return (
          <div className="property-section">
            <h3 className="text-lg font-semibold mb-3">Properti Widget</h3>
            <div className="text-gray-600 text-sm">
              <p>Tidak ada properti khusus yang tersedia untuk jenis widget ini.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div className="h-full bg-white border-l border-gray-200 flex flex-col w-64">
        {/* Header */}
        <div className="flex-shrink-0 p-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">Properti</h2>
          <p className="text-xs text-gray-600">Widget {widget.id}</p>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 property-panel-scrollable overflow-x-hidden">
          {renderGeneralProperties()}
          {getPropertyEditor()}
        </div>
      </div>

      {/* Menu Editor Modal */}
      {showMenuEditor && (
        <MenuEditor
          items={widget.items || []}
          onSave={(items) => {
            console.log('PropertyPanel: Received items from MenuEditor:', items);
            handleUpdate({ items });
            setShowMenuEditor(false);
          }}
          onClose={() => setShowMenuEditor(false)}
        />
      )}

      {/* Banner Editor Modal */}
      {showBannerEditor && (
        <BannerEditor
          widget={widget}
          menuItems={getAllMenuItems()}
          onSave={(updates) => {
            console.log('PropertyPanel: Received updates from BannerEditor:', updates);
            handleUpdate(updates);
            setShowBannerEditor(false);
          }}
          onClose={() => setShowBannerEditor(false)}
        />
      )}
    </>
  );
};

export default PropertyPanel;
