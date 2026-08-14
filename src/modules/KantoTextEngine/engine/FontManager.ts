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

class FontManagerClass {
  private customFonts: CustomFontItem[] = [];

  public async loadCustomFontFile(file: File): Promise<CustomFontItem> {
    const fontName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFamily = `KantoFont_${fontName}_${Date.now()}`;
    const arrayBuffer = await file.arrayBuffer();

    const fontFace = new FontFace(uniqueFamily, arrayBuffer);
    const loadedFace = await fontFace.load();
    document.fonts.add(loadedFace);

    const isArabicSample = this.isArabicString(file.name);
    const customItem: CustomFontItem = {
      name: file.name.replace(/\.[^/.]+$/, ''),
      family: uniqueFamily,
      category: isArabicSample ? 'arabic' : 'custom',
      sampleText: isArabicSample ? 'خط مخصص جديد' : 'Custom Loaded Font',
    };

    this.customFonts.push(customItem);
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
