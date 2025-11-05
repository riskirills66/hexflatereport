import React from 'react';
import { ContentSection } from '../types';
import IconRenderer from './IconRenderer';

interface WidgetPreviewProps {
  widget: ContentSection;
  isSelected: boolean;
}

const WidgetPreview: React.FC<WidgetPreviewProps> = ({ widget, isSelected }) => {
  const renderTitleWidget = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
      <div 
        className={`font-semibold text-gray-800 ${
          widget.title?.type === 'h1' ? 'text-xl' :
          widget.title?.type === 'h2' ? 'text-lg' :
          widget.title?.type === 'h3' ? 'text-base' :
          widget.title?.type === 'h4' ? 'text-sm' :
          widget.title?.type === 'h5' ? 'text-xs' : 'text-sm'
        }`}
        style={{ 
          textAlign: widget.title?.display as any || 'left',
          color: widget.title?.color || '#000000'
        }}
      >
                 {widget.title?.text || 'Teks Judul'}
      </div>
    </div>
  );

  const renderBannerSlider = () => (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white text-center">
      <div className="text-sm font-medium mb-2">Banner Slider</div>
      <div className="text-xs opacity-90">
                 {widget.layoutVariant === 'monocle' ? 'Gulir Horizontal' : 'Tampilan Halaman'} •  
        {widget.height || 200}px
      </div>
      {widget.autoSlide && (
        <div className="text-xs opacity-75 mt-1">
                     Geser Otomatis: {widget.autoSlideInterval || 5}s
        </div>
      )}
    </div>
  );

  const renderMenuGroup = () => {
    const frameStyle = widget.frame ? {
      width: `${widget.frame.width}px`,
      height: `${widget.frame.height}px`,
      borderRadius: `${widget.frame.borderRadius}px`,
      border: widget.frame.borderLine ? '1px solid #e5e7eb' : 'none',
      boxShadow: widget.frame.shadow ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
      padding: `${widget.frame.padding?.top || 0}px ${widget.frame.padding?.right || 0}px ${widget.frame.padding?.bottom || 0}px ${widget.frame.padding?.left || 0}px`,
    } : {};

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="text-sm font-medium text-gray-800 mb-2">Grup Menu</div>
        <div className="grid grid-cols-4 gap-2">
          {widget.items?.slice(0, 16).map((item, index) => (
            <div key={index} className="text-center p-2 bg-gray-50 rounded">
              <div className="mb-1 flex justify-center">
                {widget.frame ? (
                  <div 
                    className="flex items-center justify-center bg-white"
                    style={frameStyle}
                  >
                    <IconRenderer iconUrl={item.iconUrl} size="sm" />
                  </div>
                ) : (
                  <IconRenderer iconUrl={item.iconUrl} size="sm" />
                )}
              </div>
              <div className="text-xs text-gray-700 truncate">{item.title}</div>
              {item.submenu && <div className="text-xs text-blue-500 mt-1">▶</div>}
            </div>
          ))}
          {(!widget.items || widget.items.length === 0) && (
            <div className="col-span-4 text-center text-gray-500 py-4">
              Tidak ada item menu
            </div>
          )}
        </div>
        {widget.items && widget.items.length > 16 && (
          <div className="text-xs text-gray-500 text-center py-2 mt-2 border-t">
            +{widget.items.length - 16} item lainnya
          </div>
        )}
        {widget.frame && (
          <div className="text-xs text-blue-600 text-center py-2 mt-2 border-t border-blue-200 bg-blue-50 rounded">
            🖼️ Frame: {widget.frame.width}×{widget.frame.height}px
          </div>
        )}
      </div>
    );
  };

  const renderHistoryWidget = () => {
    const count = widget.count || 3;
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="text-sm font-medium text-gray-800 mb-2">Riwayat ({count} items)</div>
        <div className="space-y-2">
          {Array.from({ length: count }, (_, i) => i + 1).map((i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-xs text-gray-600 flex-1">Transaksi #{i}</span>
              <span className="text-xs text-green-600">+$10</span>
            </div>
          ))}
        </div>
      </div>
    );
  };


  const renderDefaultWidget = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-center">
        <div className="text-lg font-bold text-gray-800 mb-2">
          {widget.id}
        </div>
        <div className="text-sm text-gray-600">
          Jenis Widget: {widget.id}
        </div>
      </div>
    </div>
  );

  const getWidgetPreview = () => {
    switch (widget.id) {
      case 'title':
        return renderTitleWidget();
      case 'banner_slider':
        return renderBannerSlider();
      case 'history':
        return renderHistoryWidget();
      default:
        if (widget.items) {
          return renderMenuGroup();
        }
        return renderDefaultWidget();
    }
  };

  return (
    <div className={`${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''} transition-all duration-200`}>
      {getWidgetPreview()}
    </div>
  );
};

export default WidgetPreview;
