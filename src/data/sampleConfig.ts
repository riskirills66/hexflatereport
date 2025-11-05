import { DynamicScreenConfig } from '../types';

export const SAMPLE_CONFIG: DynamicScreenConfig = {
  "globalTheming": {
    "welcomePoster": {
      "imageUrl": "https://marketplace.canva.com/EAE6opqJ71M/1/0/1131w/canva-colorful-3d-illustrative-classroom-welcome-poster-6MRXrdQk88Q.jpg",
      "padding": {
        "top": 8.0,
        "bottom": 8.0,
        "left": 8.0,
        "right": 8.0
      },
      "borderRadius": 12.0,
      "route": "/product",
      "routeArgs": {
        "operators": ["TSELREG", "TSELREG2"],
        "hintText": "Nomor HP Pelanggan",
        "infoBox": "Ini adalah layar produk tes"
      }
    },
    "lightTheme": {
      "surfaceColor": "#fafafa",
      "gradiantButtonTailColor": "#085EA5",
      "gradiantButtonDisabledColor": "#FFE0E0E0",
      "gradiantButtonDisabledTextColor": "#FFD3D3D3",
      "paragraphTextColor": "#555555"
    },
    "darkTheme": {
      "surfaceColor": "#191724",
      "gradiantButtonTailColor": "#9ccfd8",
      "gradiantButtonDisabledColor": "#403d52",
      "gradiantButtonDisabledTextColor": "#524f67",
      "paragraphTextColor": "#f6c177"
    },
    "containerBorderRadius": 30
  },
  "screens": {
    "home": {
      "screen": "home",
      "balance_card": true,
      "action_buttons": [
        {
          "icon": "headset_mic_outlined",
          "route": "/pusat_bantuan",
          "tooltip": "Bantuan"
        },
        {
          "icon": "notifications_outlined",
          "route": "/notifications",
          "type": "notification",
          "tooltip": "Notifikasi"
        }
      ],
      "balance_card_variant": 6,
      "headerBackgroundUrl": {
        "shopee": {
          "imageUrl": "https://pixabay.com/images/download/art-8396377_640.png"
        }
      },
      "headerFade": true,
      "content": [
        {
          "id": "banner_slider",
          "instanceId": "banner_slider_1",
          "layoutVariant": "default",
          "height": 200,
          "spacing": 16,
          "borderRadius": 12,
          "autoSlide": true,
          "autoSlideInterval": 5,
          "showIndicators": true,
          "showFade": true,
          "banners": [
            {
              "imageUrl": "https://example.com/banner1.jpg",
              "title": "Banner Selamat Datang",
              "route": "/welcome",
              "routeArgs": {
                "param1": "value1"
              }
            }
          ]
        },
        {
          "id": "title",
          "instanceId": "title_1",
          "title": {
            "text": "Selamat Datang di Aplikasi Kami",
            "type": "h2",
            "display": "center",
            "color": "#1f2937",
            "darkModeColor": "#f9fafb"
          }
        },
        {
          "id": "pulsa",
          "instanceId": "pulsa_1",
          "items": [
            {
              "iconUrl": "📱",
              "title": "Pulsa",
              "route": "/pulsa",
              "routeArgs": {
                "category": "pulsa"
              },
              "submenu": {
                "id": "pulsa_submenu",
                "submenuTitle": "Pilih Provider",
                "submenuStyle": "fullScreen",
                "submenuLayout": "grid",
                "items": [
                  {
                    "iconUrl": "📱",
                    "title": "Telkomsel",
                    "route": "/pulsa/telkomsel"
                  },
                  {
                    "iconUrl": "📱",
                    "title": "XL",
                    "route": "/pulsa/xl"
                  }
                ]
              }
            },
            {
              "iconUrl": "💳",
              "title": "Kartu Kredit",
              "route": "/credit-card"
            }
          ]
        },
        {
          "id": "history",
          "instanceId": "history_1"
        }
      ]
    }
  },
  "navigation": {
    "menuStyle": 2,
    "mainMenu": [
      {
        "icon": "https://www.svgrepo.com/download/529026/home.svg",
        "label": "Beranda",
        "dynamic": "home",
        "active": true
      }
    ],
    "moreMenu": {
      "icon": "https://www.svgrepo.com/download/511077/more-grid-big.svg",
      "label": "Lainnya",
      "active": true,
      "items": [
        {
          "icon": "https://www.svgrepo.com/download/529867/settings.svg",
          "label": "Pengaturan",
          "route": "/settings",
          "active": true
        }
      ]
    }
  }
};
