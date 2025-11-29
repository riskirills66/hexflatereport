import { WidgetType, ContentSection } from '../types';

export const WIDGET_TYPES: WidgetType[] = [
  {
    id: 'title',
    name: 'Widget Judul',
    icon: '📝',
    description: 'Tampilkan teks dengan level heading dan styling yang berbeda',
    defaultConfig: {
      id: 'title',
      order: 1,
      title: {
        text: 'Judul Baru',
        type: 'h3',
        display: 'left',
        color: '#000000',
        darkModeColor: '#ffffff'
      }
    }
  },
  {
    id: 'banner_slider',
    name: 'Banner Slider',
    icon: '🖼️',
    description: 'Carousel gambar dengan navigasi dan geser otomatis',
    defaultConfig: {
      id: 'banner_slider',
      order: 2,
      layoutVariant: 'default',
      height: 200,
      spacing: 16,
      autoSlide: true,
      autoSlideInterval: 5,
      showIndicators: true,
      showFade: false,
      borderRadius: 12,
      banners: [
        {
          imageUrl: 'https://pixabay.com/images/download/discount-5839314_640.jpg',
          title: 'Banner Baru',
          titleFontSize: 16,
          titlePosition: { bottom: 16, left: 16 },
          padding: { all: 12 },
          borderRadius: 8
        }
      ]
    }
  },
  {
    id: 'cards',
    name: 'Cards Widget',
    icon: '🃏',
    description: 'Tampilkan kartu statis yang dapat disesuaikan dengan tombol dan teks elemen',
    defaultConfig: {
      id: 'cards',
      order: 5,
      layout: 'grid',
      crossAxisCount: 2,
      aspectRatio: 1.6,
      spacing: 16,
      cards: [
        {
          title: 'Card Title',
          subtitle: 'Card Subtitle',
          description: 'Card description text',
          backgroundColor: '#f3f4f6',
          borderRadius: 12,
          textElements: [
            {
              type: 'profile_name',
              text: 'User Name',
              textStyle: {
                fontSize: 16,
                fontWeight: '600'
              }
            }
          ],
          buttons: [
            {
              label: 'Action',
              route: '/home',
              backgroundColor: '#3b82f6',
              textColor: '#ffffff',
              borderRadius: 8
            }
          ]
        }
      ]
    }
  },
  {
    id: 'menu_group',
    name: 'Grup Menu',
    icon: '🍽️',
    description: 'Grid item menu dengan ikon dan aksi',
    defaultConfig: {
      id: 'menu_group',
      order: 3,
      items: [
        {
          iconUrl: 'https://www.svgrepo.com/download/530225/cell-phone.svg',
          title: 'Item Menu Baru',
          route: '/product',
          routeArgs: {
            operators: ['TSELREG'],
            hintText: 'Nomor HP Pelanggan'
          },
          textSize: 11
        }
      ],
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
    }
  },
  {
    id: 'history',
    name: 'Widget Riwayat',
    icon: '📚',
    description: 'Tampilkan riwayat transaksi terbaru',
    defaultConfig: {
      id: 'history',
      order: 4,
      count: 3
    }
  }
];

export const getWidgetType = (id: string): WidgetType | undefined => {
  return WIDGET_TYPES.find(widget => widget.id === id);
};

export const getDefaultConfig = (id: string): Partial<ContentSection> => {
  const widgetType = getWidgetType(id);
  return widgetType ? { ...widgetType.defaultConfig } : {};
};
