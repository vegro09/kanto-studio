import type { CustomFontItem } from '../types/engine';

export const BUILTIN_FONTS: CustomFontItem[] = [
  // Arabic Master Suite (display names in Arabic script as permitted, labels in English)
  { name: 'Cairo (القاهرة)', family: 'Cairo', category: 'arabic', sampleText: 'كانتو موشن للتصميم' },
  { name: 'Tajawal (تجوال)', family: 'Tajawal', category: 'arabic', sampleText: 'خط تجوال الأنيق' },
  { name: 'Almarai (المراعي)', family: 'Almarai', category: 'arabic', sampleText: 'المراعي الحديث' },
  { name: 'Amiri (الأميري)', family: 'Amiri', category: 'arabic', sampleText: 'الخط الأميري الكلاسيكي' },
  { name: 'Readex Pro (ريدكس)', family: 'Readex Pro', category: 'arabic', sampleText: 'ريدكس برو الاحترافي' },
  { name: 'IBM Plex Arabic (آي بي إم)', family: 'IBM Plex Sans Arabic', category: 'arabic', sampleText: 'آي بي إم بلكس عربي' },
  { name: 'Lemonada (ليمونادا)', family: 'Lemonada', category: 'arabic', sampleText: 'ليمونادا المميز' },
  { name: 'Changa (تشنجا)', family: 'Changa', category: 'arabic', sampleText: 'تشنجا العريض' },

  // Modern Latin
  { name: 'Inter', family: 'Inter', category: 'modern', sampleText: 'Modern & Clean Motion' },
  { name: 'Montserrat', family: 'Montserrat', category: 'modern', sampleText: 'Geometric Bold Impact' },
  { name: 'Poppins', family: 'Poppins', category: 'modern', sampleText: 'Geometric Rounded' },
  { name: 'Space Grotesk', family: 'Space Grotesk', category: 'modern', sampleText: 'Futuristic Typography' },

  // Display / Title
  { name: 'Bebas Neue', family: 'Bebas Neue', category: 'display', sampleText: 'CINEMATIC TITLE' },
  { name: 'Righteous', family: 'Righteous', category: 'display', sampleText: 'RETRO SYNTHWAVE' },
  { name: 'Orbitron', family: 'Orbitron', category: 'display', sampleText: 'CYBERPUNK 2077' },
  { name: 'Cinzel', family: 'Cinzel', category: 'display', sampleText: 'ELEGANT LUXURY' },
  { name: 'Playfair Display', family: 'Playfair Display', category: 'display', sampleText: 'Editorial High Fashion' },
];

const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Amiri:wght@400;700&family=Bebas+Neue&family=Cairo:wght@400;600;700;800&family=Changa:wght@400;700&family=Cinzel:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Inter:wght@400;600;700;800&family=Lemonada:wght@400;700&family=Montserrat:wght@400;600;700;800&family=Orbitron:wght@400;700&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;600;700;800&family=Readex+Pro:wght@400;600;700&family=Righteous&family=Space+Grotesk:wght@400;700&family=Tajawal:wght@400;700;800&display=swap';

if (typeof document !== 'undefined') {
  const linkId = 'kanto-google-fonts';
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }
}

class FontManagerClass {
  private customFonts: CustomFontItem[] = [];

  constructor() {
    this.initSavedCustomFonts();
  }

  private initSavedCustomFonts() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    try {
      const saved = localStorage.getItem('kanto_custom_fonts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item.name && (item.data || item.url || item.family)) {
              const fontName = item.family || item.name;
              const fontData = item.data || item.url;
              if (fontData) {
                try {
                  const fontFace = new FontFace(fontName, `url(${fontData})`);
                  fontFace.load().then((loaded) => {
                    document.fonts.add(loaded);
                  }).catch((err) => console.warn('[FontManager] FontFace load error:', fontName, err));

                  const styleId = `font-style-${fontName.toLowerCase()}`;
                  if (!document.getElementById(styleId)) {
                    const style = document.createElement('style');
                    style.id = styleId;
                    style.textContent = `
                      @font-face {
                        font-family: '${fontName}';
                        src: url('${fontData}');
                        font-weight: normal;
                        font-style: normal;
                        font-display: swap;
                      }
                    `;
                    document.head.appendChild(style);
                  }
                } catch (e) {
                  console.warn('[FontManager] Error initializing font:', fontName, e);
                }
              }
              const isArabic = this.isArabicString(item.name);
              this.registerCustomFont({
                name: item.name,
                family: fontName,
                category: isArabic ? 'arabic' : 'custom',
                sampleText: isArabic ? 'خط مخصص جديد' : 'Custom Loaded Font',
                data: fontData
              });
            }
          });
        }
      }
    } catch (err) {
      console.error('[FontManager] Error reading saved custom fonts:', err);
    }
  }

  public registerCustomFont(item: CustomFontItem): void {
    if (!this.customFonts.some((f) => f.family === item.family)) {
      this.customFonts.push(item);
    }
  }

  public async loadCustomFontFile(file: File): Promise<CustomFontItem> {
    const cleanName = file.name.replace(/\.[^/.]+$/, '').trim();
    const rawName = cleanName.replace(/[^a-zA-Z0-9_\-\s]/g, '_');
    const fontName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });

    // 1. Native FontFace API loading via Base64 Data URL
    const fontFace = new FontFace(fontName, `url(${base64Data})`);
    const loadedFace = await fontFace.load();
    document.fonts.add(loadedFace);

    // 2. Dual @font-face style tag injection for Canvas context rendering
    const styleId = `font-style-${fontName.toLowerCase()}`;
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @font-face {
          font-family: '${fontName}';
          src: url('${base64Data}');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
      document.head.appendChild(style);
    }

    const isArabicSample = this.isArabicString(file.name);
    const customItem: CustomFontItem = {
      name: cleanName,
      family: fontName,
      category: isArabicSample ? 'arabic' : 'custom',
      sampleText: isArabicSample ? 'خط مخصص جديد' : 'Custom Loaded Font',
      data: base64Data
    };

    this.registerCustomFont(customItem);

    // 3. Save to localStorage under 'kanto_custom_fonts'
    try {
      const existingSaved = localStorage.getItem('kanto_custom_fonts');
      let fontList: any[] = existingSaved ? JSON.parse(existingSaved) : [];
      if (!Array.isArray(fontList)) fontList = [];
      fontList = fontList.filter((f: any) => f.name !== cleanName && f.family !== fontName);
      fontList.push({ name: cleanName, family: fontName, data: base64Data });
      localStorage.setItem('kanto_custom_fonts', JSON.stringify(fontList));
    } catch (storageErr) {
      console.error('[FontManager] Storage error:', storageErr);
    }

    return customItem;
  }

  public getCustomFonts(): CustomFontItem[] {
    return this.customFonts;
  }

  public getAllFonts(): CustomFontItem[] {
    return [...BUILTIN_FONTS, ...this.customFonts];
  }

  public isArabicString(text: string): boolean {
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicPattern.test(text);
  }
}

export const FontManager = new FontManagerClass();
